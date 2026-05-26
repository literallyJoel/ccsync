const FullPageSpinner = () => (
  <div className="flex min-h-screen items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <span className="h-20 w-20 animate-spin rounded-full border-8 border-white border-t-transparent" />
      <p className="text-xl text-gray-300">CCSync Loading...</p>
    </div>
  </div>
);

export default FullPageSpinner;
