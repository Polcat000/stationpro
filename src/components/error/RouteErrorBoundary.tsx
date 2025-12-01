import {
  useRouter,
  isNotFound,
  type ErrorComponentProps,
} from '@tanstack/react-router'

export function RouteErrorBoundary({ error, reset }: ErrorComponentProps) {
  const router = useRouter()

  // Use TanStack Router's isNotFound() to detect route errors (Task 3.3)
  const isRouteNotFound = isNotFound(error)

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <h1 className="mb-4 text-4xl font-bold text-red-600">
          {isRouteNotFound ? '404' : 'Error'}
        </h1>
        <p className="mb-6 text-gray-600">
          {isRouteNotFound
            ? 'The page you are looking for does not exist.'
            : error instanceof Error
              ? error.message
              : 'An unexpected error occurred.'}
        </p>
        <div className="flex justify-center gap-4">
          <button
            onClick={() => {
              reset()
            }}
            className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          >
            Try Again
          </button>
          <button
            onClick={() => {
              router.navigate({ to: '/' })
            }}
            className="rounded bg-gray-500 px-4 py-2 text-white hover:bg-gray-600"
          >
            Go Home
          </button>
        </div>
      </div>
    </div>
  )
}
