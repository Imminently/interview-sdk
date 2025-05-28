export const CurrencyControlStyles = {
  fieldset: "relative border border-gray-300 rounded-md px-2 pb-2 focus-within:border-black transition-colors duration-200 mb-4",
  input: "block w-full bg-transparent outline-none pt-2 pb-1 pl-7 pr-2 text-base peer placeholder-transparent",
  inputSeperate: "block border border-gray-300 rounded-md w-full bg-transparent outline-none pt-2 pb-1 pl-7 pr-2 text-base peer placeholder-transparent mb-4",
  symbol: "absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-base pointer-events-none select-none",
  label: "absolute left-3 bg-white px-1 pointer-events-none transition-all duration-200 peer-focus:top-[-0.5rem] peer-focus:-translate-y-1/2 peer-focus:text-xs peer-focus:text-black",
  labelSeperate: "block text-sm font-bold mb-2",
  labelNoValue: "top-1/2 -translate-y-1/2 text-base text-gray-500", // for input
  labelWithValue: "top-[-0.5rem] -translate-y-1/2 text-xs text-black",
  legend: "px-1 text-xs transition-all duration-200"
};