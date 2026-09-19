import { forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const PasswordInput = forwardRef<HTMLInputElement, React.ComponentProps<typeof Input>>(({ className, ...props }, ref) => {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Input ref={ref} type={visible ? "text" : "password"} className={cn("pr-11", className)} {...props} />
      <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1 h-8 w-8" onClick={() => setVisible((value) => !value)} aria-label={visible ? "Hide password" : "Show password"}>
        {visible ? <EyeOff /> : <Eye />}
      </Button>
    </div>
  );
});
PasswordInput.displayName = "PasswordInput";