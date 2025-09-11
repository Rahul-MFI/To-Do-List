import { CheckCircle, X, XCircle } from "lucide-react";

export default function SuccessBar({
  message,
  isAnimating,
  hideSuccess,
  isSuccessDelete,
}) {
  return (
    <div
      className={`absolute w-2/3 md:w-1/3 xl:w-1/4 top-4 left-1/2 -translate-x-1/2 z-100 p-4 duration-300 ease-in-out ${
        isAnimating ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      <div
        className={`text-white px-6 py-4 flex items-center justify-between shadow-lg ${isSuccessDelete ? "bg-green-500" : "bg-red-500"}`}
      >
        <div className="flex items-center space-x-3">
          {isSuccessDelete ? (
           <CheckCircle className="h-6 w-6" />
          ) : (
            <XCircle className="h-6 w-6" />
          )}
          <span className="font-medium">{message}</span>
        </div>
        <button
          onClick={hideSuccess}
          className="text-white hover:text-green-200 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
