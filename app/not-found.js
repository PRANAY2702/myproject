export default function NotFound() {
    return (
        <div className="min-h-screen w-full flex items-center justify-center text-center font-sans">
            <div className="space-y-6">
                <h1 className="text-6xl font-bold text-gray-800">404</h1>
                <p className="text-xl text-gray-600">Page Not Found</p>
                <a href="/" className="inline-block px-6 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition">Go Home</a>
            </div>
        </div>
    )
}