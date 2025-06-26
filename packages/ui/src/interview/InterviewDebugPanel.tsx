import React, { useState } from "react"
import { useFormContext } from "react-hook-form"
import { BracesIcon, XIcon } from "lucide-react"
import { Button } from "../components/ui/button"
import { Badge } from "../components/ui/badge"
import { cn } from "@/ui/util"

// Floating Action Button style
const fabStyle: React.CSSProperties = {
  position: "fixed",
  bottom: 24,
  right: 24,
  zIndex: 100,
}

// export default function InterviewDebugPanel() {
//   const [open, setOpen] = useState(false);
//   // const { session } = useInterview();
//   const { watch } = useFormContext();
//   const values = watch();
//   return (
//     <Popover open={open}>
//       <PopoverTrigger asChild>
//         <Button onClick={() => setOpen(true)} style={fabStyle} className="rounded-full" size="icon" variant="default">
//           <BracesIcon />
//         </Button>
//       </PopoverTrigger>
//       <PopoverContent
//         align="end"
//         side="left"
//         sideOffset={8}
//         className="w-80"
//       >
//         <div className="flex flex-row items-center justify-between">
//           <span className="font-semibold">Debug Panel</span>
//           <Button onClick={() => setOpen(false)} size="icon" variant="ghost" aria-label="Close Debug Panel">
//             <XIcon className="h-4 w-4" />
//           </Button>
//         </div>
//         {/* for each value, display key and value */}
//         <div className="mt-4">
//           {Object.entries(values).map(([key, value]) => (
//             <div key={key} className="flex items-center justify-between py-1">
//               <span className="text-sm font-mono text-muted-foreground">{key}:</span>
//               <Badge className="rounded-full text-sm font-mono">{JSON.stringify(value)}</Badge>
//             </div>
//           ))}
//         </div>
//       </PopoverContent>
//     </Popover>
//   )
// }

const stringValue = (value: any) => {
  // support null -> null, undefined -> undefined, boolean -> true/false, number -> string
  if (typeof value === "string") {
    return value;
  } else if (typeof value === "object") {
    return JSON.stringify(value);
  } else if (value === null) {
    return "null";
  } else if (value === undefined) {
    return "undefined";
  } else {
    return String(value);
  }
}

export default function InterviewDebugPanel() {
  const [open, setOpen] = useState(false);
  // const { session } = useInterview();
  const { watch } = useFormContext();
  const values = watch();
  return (
    <>
      <Button onClick={() => setOpen(true)} style={fabStyle} className="rounded-full" size="icon" variant="default">
        <BracesIcon />
      </Button>
      <div
        className={cn(
          "fixed  right-0 inset-y-8 z-100 bg-card p-6 border rounded-l-xl transition-transform duration-300",
          open ? "translate-x-0" : "translate-x-full"
        )}
        style={{ width: 400, maxWidth: "100vw" }}
      >
        <div className="flex flex-row items-center justify-between">
          <span className="font-semibold">Debug Panel</span>
          <Button onClick={() => setOpen(false)} size="icon" variant="ghost" aria-label="Close Debug Panel">
            <XIcon className="h-4 w-4" />
          </Button>
        </div>
        {/* for each value, display key and value */}
        <div className="overflow-y-auto max-h-[80vh]">
          {Object.entries(values).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between py-1">
              <span className="text-sm font-mono text-muted-foreground">{key}</span>
              <Badge className="rounded-full text-sm font-mono">{stringValue(value)}</Badge>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
