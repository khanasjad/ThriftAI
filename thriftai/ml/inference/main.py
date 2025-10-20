"""
ThriftAI ML Inference API
Phase 3: ML Integration for Veritas Enhancement

FastAPI server for ML model inference
"""

import os
import time
from contextlib import asynccontextmanager
from typing import Dict
import structlog

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
from starlette.responses import Response

from schemas import (
    ScorePredictionRequest,
    ScorePredictionResponse,
    AnomalyDetectionResponse,
    UserClusterResponse,
    CreateExperimentRequest,
    ExperimentResultsResponse,
    HealthCheckResponse,
    ErrorResponse,
)

# Initialize structured logging
log = structlog.get_logger()

# Prometheus metrics
REQUESTS_TOTAL = Counter(
    "thriftai_ml_requests_total",
    "Total ML API requests",
    ["endpoint", "method", "status"]
)
INFERENCE_TIME = Histogram(
    "thriftai_ml_inference_seconds",
    "ML inference time in seconds",
    ["model_type"]
)

# Global model registry
MODELS: Dict = {}

# Import predictor classes
from predictor import ScorePredictor, AnomalyDetector

# ============================================================================
# Lifecycle Management
# ============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifecycle - load models on startup"""

    log.info("🚀 Starting ThriftAI ML Inference API")

    # Load models on startup
    try:
        log.info("📦 Loading ML models...")

        # Phase 3.2: Score prediction model
        score_model_dir = os.getenv("MODELS_DIR", "../models")
        score_predictor_path = f"{score_model_dir}/score_predictor_v1.joblib"
        score_encoders_path = f"{score_model_dir}/score_predictor_encoders_v1.joblib"
        score_features_path = f"{score_model_dir}/score_predictor_features_v1.joblib"

        if all(os.path.exists(p) for p in [score_predictor_path, score_encoders_path, score_features_path]):
            MODELS['score_predictor'] = ScorePredictor(
                score_predictor_path,
                score_encoders_path,
                score_features_path
            )
            log.info("✅ Score predictor loaded")
        else:
            log.warning("⚠️  Score predictor model not found. Run training first.")
            MODELS['score_predictor'] = None

        # Phase 3.3: Anomaly detection model
        anomaly_model_path = f"{score_model_dir}/anomaly_detector_v1.joblib"
        anomaly_scaler_path = f"{score_model_dir}/anomaly_detector_scaler_v1.joblib"
        anomaly_features_path = f"{score_model_dir}/anomaly_detector_features_v1.joblib"
        anomaly_metadata_path = f"{score_model_dir}/anomaly_detector_metadata_v1.json"

        if all(os.path.exists(p) for p in [anomaly_model_path, anomaly_scaler_path, anomaly_features_path, anomaly_metadata_path]):
            MODELS['anomaly_detector'] = AnomalyDetector(
                anomaly_model_path,
                anomaly_scaler_path,
                anomaly_features_path,
                anomaly_metadata_path
            )
            log.info("✅ Anomaly detector loaded")
        else:
            log.warning("⚠️  Anomaly detector model not found. Run training first.")
            MODELS['anomaly_detector'] = None

        # Phase 3.4: User clustering model
        user_cluster_path = f"{score_model_dir}/user_clusters_v1.joblib"
        if os.path.exists(user_cluster_path):
            import joblib
            MODELS['user_cluster'] = joblib.load(user_cluster_path)
            log.info("✅ User clustering model loaded")
        else:
            log.warning("⚠️  User clustering model not found")
            MODELS['user_cluster'] = None

        log.info("✅ ML API ready", models_loaded=[k for k, v in MODELS.items() if v is not None])

    except Exception as e:
        log.error("❌ Failed to load models", error=str(e))
        raise

    yield

    # Cleanup on shutdown
    log.info("👋 Shutting down ThriftAI ML Inference API")
    MODELS.clear()


# ============================================================================
# FastAPI Application
# ============================================================================

app = FastAPI(
    title="ThriftAI ML Inference API",
    description="Machine Learning inference server for Veritas score prediction, anomaly detection, and user clustering",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3002", "http://localhost:3003"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all requests with timing"""
    start_time = time.time()

    # Process request
    response = await call_next(request)

    # Log request
    duration = time.time() - start_time
    log.info(
        "request_completed",
        method=request.method,
        path=request.url.path,
        status_code=response.status_code,
        duration_ms=round(duration * 1000, 2)
    )

    # Record metrics
    REQUESTS_TOTAL.labels(
        endpoint=request.url.path,
        method=request.method,
        status=response.status_code
    ).inc()

    return response


# ============================================================================
# Health Check Endpoints
# ============================================================================

@app.get("/health", response_model=HealthCheckResponse)
async def health_check():
    """Health check endpoint"""
    return HealthCheckResponse(
        status="healthy",
        version="1.0.0",
        models_loaded={
            "score_predictor": MODELS.get('score_predictor') is not None,
            "anomaly_detector": MODELS.get('anomaly_detector') is not None,
            "user_cluster": MODELS.get('user_cluster') is not None,
        }
    )


@app.get("/metrics")
async def metrics():
    """Prometheus metrics endpoint"""
    return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)


# ============================================================================
# Phase 3.2: Score Prediction Endpoint
# ============================================================================

@app.post("/api/ml/predict-score", response_model=ScorePredictionResponse)
async def predict_score(request: ScorePredictionRequest):
    """
    Predict Veritas score for a new product

    Uses XGBoost regression model trained on historical products
    Returns predicted score with confidence and feature importance
    """
    start_time = time.time()

    try:
        log.info("predict_score_request", product_name=request.product.name)

        # Check if model is loaded
        predictor = MODELS.get('score_predictor')
        if predictor is None:
            raise HTTPException(
                status_code=503,
                detail="Score predictor model not loaded. Please train the model first."
            )

        # Run prediction
        predicted_score, confidence, importance = predictor.predict(request.product)

        # Generate explanation
        explanation = predictor.generate_explanation(
            predicted_score,
            importance,
            request.product
        )

        inference_time_ms = (time.time() - start_time) * 1000

        # Record metrics
        INFERENCE_TIME.labels(model_type="score_predictor").observe(time.time() - start_time)

        log.info(
            "predict_score_success",
            score=predicted_score,
            confidence=confidence,
            inference_ms=inference_time_ms
        )

        return ScorePredictionResponse(
            predicted_score=predicted_score,
            confidence=confidence,
            feature_importance=importance,
            explanation=explanation,
            model_version="v1.0.0",
            inference_time_ms=inference_time_ms
        )

    except HTTPException:
        raise
    except Exception as e:
        log.error("predict_score_error", error=str(e))
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


# ============================================================================
# Phase 3.3: Anomaly Detection Endpoint
# ============================================================================

@app.get("/api/ml/detect-anomalies/{product_id}", response_model=AnomalyDetectionResponse)
async def detect_anomalies(product_id: str):
    """
    Detect anomalies in product listing

    Uses Isolation Forest to identify:
    - Pricing anomalies
    - Seller behavior anomalies
    - Product specification anomalies
    """
    start_time = time.time()

    try:
        log.info("detect_anomalies_request", product_id=product_id)

        # Check if model is loaded
        detector = MODELS.get('anomaly_detector')
        if detector is None:
            raise HTTPException(
                status_code=503,
                detail="Anomaly detector model not loaded. Please train the model first."
            )

        # Fetch product from database
        import psycopg2
        from psycopg2.extras import RealDictCursor

        db_config = {
            'host': os.getenv('DB_HOST', 'localhost'),
            'port': os.getenv('DB_PORT', '5432'),
            'database': os.getenv('DB_NAME', 'thriftai_nextjs_dev'),
            'user': os.getenv('DB_USER', 'asjadkhan'),
            'password': os.getenv('DB_PASSWORD', '')
        }

        conn = psycopg2.connect(**db_config)
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        # Fetch product with seller info
        cursor.execute("""
            SELECT
                p.*,
                json_build_object(
                    'rating', s.rating,
                    'isVerified', s."isVerified",
                    'totalSales', s."totalSales",
                    'responseTimeHours', s."responseTimeHours",
                    'onTimeDeliveryRate', s."onTimeDeliveryRate",
                    'customerSatisfactionRate', s."customerSatisfactionRate",
                    'createdAt', s."createdAt"
                ) as seller
            FROM products p
            LEFT JOIN sellers s ON p."sellerId" = s.id
            WHERE p.id = %s
        """, (product_id,))

        product = cursor.fetchone()

        if not product:
            conn.close()
            raise HTTPException(status_code=404, detail="Product not found")

        # Fetch category median price
        cursor.execute("""
            SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY price) as median_price
            FROM products
            WHERE category = %s AND "isAvailable" = true
        """, (product['category'],))

        category_stats = cursor.fetchone()
        category_median_price = float(category_stats['median_price']) if category_stats else None

        conn.close()

        # Run anomaly detection
        is_anomaly, anomaly_score, risk_level, flags = detector.detect(
            dict(product),
            category_median_price
        )

        # Determine action
        if risk_level == "CRITICAL":
            action = "AUTO_REJECT"
        elif risk_level in ["HIGH", "MEDIUM"]:
            action = "MANUAL_REVIEW"
        else:
            action = "AUTO_APPROVE"

        # Get comparison if anomalous
        comparison = None
        if category_median_price and is_anomaly:
            comparison = detector.get_similar_products_comparison(
                float(product['price']),
                category_median_price
            )

        inference_time_ms = (time.time() - start_time) * 1000

        # Record metrics
        INFERENCE_TIME.labels(model_type="anomaly_detector").observe(time.time() - start_time)

        log.info(
            "detect_anomalies_success",
            product_id=product_id,
            is_anomaly=is_anomaly,
            risk_level=risk_level,
            inference_ms=inference_time_ms
        )

        return AnomalyDetectionResponse(
            is_anomaly=is_anomaly,
            anomaly_score=anomaly_score,
            risk_level=risk_level,
            flags=flags,
            similar_products_comparison=comparison,
            action=action
        )

    except HTTPException:
        raise
    except Exception as e:
        log.error("detect_anomalies_error", error=str(e), product_id=product_id)
        raise HTTPException(status_code=500, detail=f"Anomaly detection failed: {str(e)}")


# ============================================================================
# Phase 3.4: User Clustering Endpoint
# ============================================================================

@app.get("/api/ml/user-clusters/{user_id}", response_model=UserClusterResponse)
async def get_user_cluster(user_id: str):
    """
    Get user's cluster and collaborative recommendations

    Uses K-Means clustering to group users by behavior
    Returns cluster ID, characteristics, and collaborative filtering recommendations
    """
    start_time = time.time()

    try:
        log.info("user_cluster_request", user_id=user_id)

        # Check if model is loaded
        if MODELS.get('user_cluster') is None:
            raise HTTPException(
                status_code=503,
                detail="User clustering model not loaded. Please train the model first."
            )

        # TODO: Fetch user features from database
        # TODO: Predict cluster
        # TODO: Get collaborative recommendations

        # Record metrics
        INFERENCE_TIME.labels(model_type="user_cluster").observe(time.time() - start_time)

        # Placeholder response
        return UserClusterResponse(
            user_id=user_id,
            cluster_id=2,
            cluster_name="Quality-Focused Premium Buyers",
            cluster_characteristics={
                "price_vs_quality_avg": 0.82,
                "sustainability_score_avg": 0.45,
                "brand_loyalty_avg": 0.88,
                "average_order_value_avg": 247.50
            },
            user_position={
                "price_vs_quality": 0.85,
                "deviation_from_cluster": 0.03
            },
            similar_users_count=1247,
            collaborative_recommendations=[]
        )

    except HTTPException:
        raise
    except Exception as e:
        log.error("user_cluster_error", error=str(e), user_id=user_id)
        raise HTTPException(status_code=500, detail=f"User clustering failed: {str(e)}")


# ============================================================================
# Phase 3.5: A/B Testing Endpoints
# ============================================================================

@app.post("/api/ml/ab-test", status_code=201)
async def create_experiment(request: CreateExperimentRequest):
    """
    Create a new A/B test experiment

    Sets up experiment with multiple variants and tracks assignments
    """
    try:
        log.info("create_experiment_request", name=request.name)

        import psycopg2
        from psycopg2.extras import RealDictCursor
        import uuid

        db_config = {
            'host': os.getenv('DB_HOST', 'localhost'),
            'port': os.getenv('DB_PORT', '5432'),
            'database': os.getenv('DB_NAME', 'thriftai_nextjs_dev'),
            'user': os.getenv('DB_USER', 'asjadkhan'),
            'password': os.getenv('DB_PASSWORD', '')
        }

        conn = psycopg2.connect(**db_config)
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        # Create experiment
        experiment_id = str(uuid.uuid4())
        cursor.execute("""
            INSERT INTO ab_experiments (
                id, name, description, duration_days, primary_metric,
                secondary_metrics, confidence_level, minimum_sample_size
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id, status
        """, (
            experiment_id,
            request.name,
            request.description,
            request.duration_days,
            request.primary_metric,
            psycopg2.extras.Json(request.secondary_metrics) if request.secondary_metrics else None,
            0.95,  # Default confidence level
            1000   # Default minimum sample size
        ))

        result = cursor.fetchone()

        # Create variants
        control_variant_id = None
        for variant in request.variants:
            variant_id = str(uuid.uuid4())
            cursor.execute("""
                INSERT INTO ab_variants (
                    id, experiment_id, name, description, traffic_percentage,
                    config, is_control
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            """, (
                variant_id,
                experiment_id,
                variant.name,
                variant.description,
                variant.traffic_percentage,
                psycopg2.extras.Json(variant.config),
                variant.is_control
            ))

            if variant.is_control:
                control_variant_id = variant_id

        # Set control variant on experiment
        if control_variant_id:
            cursor.execute("""
                UPDATE ab_experiments
                SET control_variant_id = %s
                WHERE id = %s
            """, (control_variant_id, experiment_id))

        conn.commit()
        conn.close()

        log.info("create_experiment_success", experiment_id=experiment_id)

        return {
            "experiment_id": experiment_id,
            "status": result['status'],
            "message": "Experiment created successfully"
        }

    except Exception as e:
        log.error("create_experiment_error", error=str(e))
        raise HTTPException(status_code=500, detail=f"Experiment creation failed: {str(e)}")


@app.get("/api/ml/ab-test/{experiment_id}/results", response_model=ExperimentResultsResponse)
async def get_experiment_results(experiment_id: str):
    """
    Get A/B test experiment results

    Returns statistical analysis of variants with recommendations
    """
    try:
        log.info("experiment_results_request", experiment_id=experiment_id)

        import psycopg2
        from psycopg2.extras import RealDictCursor
        from datetime import datetime

        db_config = {
            'host': os.getenv('DB_HOST', 'localhost'),
            'port': os.getenv('DB_PORT', '5432'),
            'database': os.getenv('DB_NAME', 'thriftai_nextjs_dev'),
            'user': os.getenv('DB_USER', 'asjadkhan'),
            'password': os.getenv('DB_PASSWORD', '')
        }

        conn = psycopg2.connect(**db_config)
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        # Get experiment details
        cursor.execute("""
            SELECT id, name, status, start_date, created_at
            FROM ab_experiments
            WHERE id = %s
        """, (experiment_id,))

        experiment = cursor.fetchone()
        if not experiment:
            conn.close()
            raise HTTPException(status_code=404, detail="Experiment not found")

        # Calculate days running
        start_date = experiment['start_date'] or experiment['created_at']
        days_running = (datetime.now() - start_date).days

        # Refresh materialized view
        cursor.execute("SELECT refresh_ab_metrics()")

        # Get metrics from materialized view
        cursor.execute("""
            SELECT
                variant_id,
                variant_name,
                is_control,
                unique_users,
                purchases,
                conversion_rate,
                total_revenue,
                avg_order_value
            FROM ab_experiment_metrics
            WHERE experiment_id = %s
            ORDER BY is_control DESC
        """, (experiment_id,))

        metrics = cursor.fetchall()

        if len(metrics) < 2:
            conn.close()
            return ExperimentResultsResponse(
                experiment_id=experiment_id,
                status=experiment['status'],
                days_running=days_running,
                total_users=0,
                results={},
                analysis={
                    "conversion_rate_lift": 0,
                    "p_value": 1.0,
                    "confidence": 0,
                    "recommendation": "INSUFFICIENT_DATA"
                }
            )

        # Separate control and treatment
        control = next((m for m in metrics if m['is_control']), metrics[0])
        treatment = next((m for m in metrics if not m['is_control']), metrics[1])

        # Calculate statistical significance using database function
        cursor.execute("""
            SELECT * FROM calculate_statistical_significance(%s, %s, %s, %s)
        """, (
            control['purchases'],
            control['unique_users'],
            treatment['purchases'],
            treatment['unique_users']
        ))

        stats = cursor.fetchone()
        conn.close()

        # Calculate lift
        conversion_rate_lift = 0
        if control['conversion_rate'] > 0:
            conversion_rate_lift = (
                (treatment['conversion_rate'] - control['conversion_rate']) /
                control['conversion_rate'] * 100
            )

        # Determine recommendation
        recommendation = "CONTINUE_TESTING"
        if stats['is_significant']:
            if conversion_rate_lift > 5:
                recommendation = "IMPLEMENT_TREATMENT"
            elif conversion_rate_lift < -5:
                recommendation = "REJECT_TREATMENT"
        elif control['unique_users'] + treatment['unique_users'] < 1000:
            recommendation = "INSUFFICIENT_DATA"

        total_users = control['unique_users'] + treatment['unique_users']

        log.info(
            "experiment_results_success",
            experiment_id=experiment_id,
            total_users=total_users,
            lift=conversion_rate_lift
        )

        return ExperimentResultsResponse(
            experiment_id=experiment_id,
            status=experiment['status'],
            days_running=days_running,
            total_users=total_users,
            results={
                "control": {
                    "users": control['unique_users'],
                    "conversions": control['purchases'],
                    "conversion_rate": float(control['conversion_rate']),
                    "avg_order_value": float(control['avg_order_value'] or 0)
                },
                "treatment": {
                    "users": treatment['unique_users'],
                    "conversions": treatment['purchases'],
                    "conversion_rate": float(treatment['conversion_rate']),
                    "avg_order_value": float(treatment['avg_order_value'] or 0)
                }
            },
            analysis={
                "conversion_rate_lift": round(conversion_rate_lift, 2),
                "p_value": float(stats['p_value']),
                "confidence": round((1 - stats['p_value']) * 100, 1),
                "recommendation": recommendation
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        log.error("experiment_results_error", error=str(e), experiment_id=experiment_id)
        raise HTTPException(status_code=500, detail=f"Failed to get experiment results: {str(e)}")


@app.post("/api/ml/ab-test/{experiment_id}/assign/{user_id}")
async def assign_user_to_variant(experiment_id: str, user_id: str, session_id: str = None):
    """
    Assign user to a variant in an experiment

    Uses weighted random assignment based on traffic percentages
    Returns variant configuration to use
    """
    try:
        log.info("assign_user_request", experiment_id=experiment_id, user_id=user_id)

        import psycopg2
        from psycopg2.extras import RealDictCursor

        db_config = {
            'host': os.getenv('DB_HOST', 'localhost'),
            'port': os.getenv('DB_PORT', '5432'),
            'database': os.getenv('DB_NAME', 'thriftai_nextjs_dev'),
            'user': os.getenv('DB_USER', 'asjadkhan'),
            'password': os.getenv('DB_PASSWORD', '')
        }

        conn = psycopg2.connect(**db_config)
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        # Use database function to assign user
        cursor.execute("""
            SELECT assign_user_to_variant(%s, %s, %s) as variant_id
        """, (experiment_id, user_id, session_id))

        result = cursor.fetchone()
        variant_id = result['variant_id']

        # Get variant details
        cursor.execute("""
            SELECT id, name, config, is_control, traffic_percentage
            FROM ab_variants
            WHERE id = %s
        """, (variant_id,))

        variant = cursor.fetchone()
        conn.close()

        if not variant:
            raise HTTPException(status_code=404, detail="Variant not found")

        log.info("assign_user_success", user_id=user_id, variant_id=variant_id)

        return {
            "variant_id": variant['id'],
            "variant_name": variant['name'],
            "config": variant['config'],
            "is_control": variant['is_control']
        }

    except HTTPException:
        raise
    except Exception as e:
        log.error("assign_user_error", error=str(e), user_id=user_id)
        raise HTTPException(status_code=500, detail=f"User assignment failed: {str(e)}")


@app.post("/api/ml/ab-test/{experiment_id}/track")
async def track_event(
    experiment_id: str,
    user_id: str,
    event_type: str,
    event_data: dict = None,
    session_id: str = None
):
    """
    Track an event for A/B test analysis

    Event types: view, click, add_to_cart, purchase, custom
    """
    try:
        log.info("track_event_request", experiment_id=experiment_id, event_type=event_type)

        import psycopg2
        from psycopg2.extras import RealDictCursor

        db_config = {
            'host': os.getenv('DB_HOST', 'localhost'),
            'port': os.getenv('DB_PORT', '5432'),
            'database': os.getenv('DB_NAME', 'thriftai_nextjs_dev'),
            'user': os.getenv('DB_USER', 'asjadkhan'),
            'password': os.getenv('DB_PASSWORD', '')
        }

        conn = psycopg2.connect(**db_config)
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        # Use database function to track event
        cursor.execute("""
            SELECT track_ab_event(%s, %s, %s, %s, %s)
        """, (
            experiment_id,
            user_id,
            event_type,
            psycopg2.extras.Json(event_data) if event_data else None,
            session_id
        ))

        conn.commit()
        conn.close()

        log.info("track_event_success", user_id=user_id, event_type=event_type)

        return {"status": "tracked", "event_type": event_type}

    except Exception as e:
        log.error("track_event_error", error=str(e), event_type=event_type)
        raise HTTPException(status_code=500, detail=f"Event tracking failed: {str(e)}")


@app.patch("/api/ml/ab-test/{experiment_id}/status")
async def update_experiment_status(experiment_id: str, status: str):
    """
    Update experiment status (DRAFT, ACTIVE, PAUSED, COMPLETED, ARCHIVED)

    ACTIVE experiments will set start_date if not already set
    """
    try:
        log.info("update_status_request", experiment_id=experiment_id, status=status)

        import psycopg2
        from psycopg2.extras import RealDictCursor
        from datetime import datetime

        valid_statuses = ['DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED']
        if status not in valid_statuses:
            raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")

        db_config = {
            'host': os.getenv('DB_HOST', 'localhost'),
            'port': os.getenv('DB_PORT', '5432'),
            'database': os.getenv('DB_NAME', 'thriftai_nextjs_dev'),
            'user': os.getenv('DB_USER', 'asjadkhan'),
            'password': os.getenv('DB_PASSWORD', '')
        }

        conn = psycopg2.connect(**db_config)
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        # Update status
        if status == 'ACTIVE':
            # Set start_date if not already set
            cursor.execute("""
                UPDATE ab_experiments
                SET status = %s::experiment_status,
                    start_date = COALESCE(start_date, CURRENT_TIMESTAMP),
                    end_date = CASE
                        WHEN end_date IS NULL THEN CURRENT_TIMESTAMP + (duration_days || ' days')::INTERVAL
                        ELSE end_date
                    END
                WHERE id = %s
                RETURNING status, start_date, end_date
            """, (status, experiment_id))
        else:
            cursor.execute("""
                UPDATE ab_experiments
                SET status = %s::experiment_status
                WHERE id = %s
                RETURNING status, start_date, end_date
            """, (status, experiment_id))

        result = cursor.fetchone()
        if not result:
            conn.close()
            raise HTTPException(status_code=404, detail="Experiment not found")

        conn.commit()
        conn.close()

        log.info("update_status_success", experiment_id=experiment_id, new_status=status)

        return {
            "experiment_id": experiment_id,
            "status": result['status'],
            "start_date": result['start_date'].isoformat() if result['start_date'] else None,
            "end_date": result['end_date'].isoformat() if result['end_date'] else None
        }

    except HTTPException:
        raise
    except Exception as e:
        log.error("update_status_error", error=str(e), experiment_id=experiment_id)
        raise HTTPException(status_code=500, detail=f"Status update failed: {str(e)}")


# ============================================================================
# Error Handler
# ============================================================================

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Custom HTTP exception handler"""
    return JSONResponse(
        status_code=exc.status_code,
        content=ErrorResponse(
            error=exc.detail,
            detail=str(exc)
        ).dict()
    )


# ============================================================================
# Main Entry Point
# ============================================================================

if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("ML_API_PORT", "8000"))

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=True,  # Enable auto-reload during development
        log_level="info"
    )
