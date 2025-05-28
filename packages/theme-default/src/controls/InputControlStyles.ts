export const InputControlStyles = {
  fieldset: "relative border border-gray-300 rounded-md px-2 pb-2 focus-within:border-black transition-colors duration-200 mb-4",
  input: "block w-full bg-transparent outline-none pt-2 pb-1 px-0 text-base peer placeholder-transparent",
  inputSeperate: "block border border-gray-300 rounded-md w-full bg-transparent outline-none pt-2 pb-1 px-2 text-base peer placeholder-transparent mb-4",
  label: "absolute left-3 bg-white px-1 pointer-events-none transition-all duration-200",
  labelSeperate: "block text-sm font-bold mb-2",
  labelNoValue: "top-1/2 -translate-y-1/2 text-base text-gray-500", // for input
  labelTextareaNoValue: "top-2 text-base text-gray-500", // for textarea (no translate-y)
  labelWithValue: "top-[-0.5rem] -translate-y-1/2 text-xs text-black",
  legend: "px-1 text-xs transition-all duration-200"
};