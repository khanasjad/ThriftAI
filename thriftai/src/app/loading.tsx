export default function Loading() {
  return (
    <div className="bg-white min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-black/10 border-t-black rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[17px] text-black/40">Loading...</p>
      </div>
    </div>
  )
}
