import { toast as sonnerToast } from "sonner";

export function useToast() {
  const toast = ({ title, description, variant, ...props }: any) => {
    if (variant === "destructive") {
      sonnerToast.error(title || "Error", {
        description,
        ...props,
      });
    } else {
      sonnerToast(title || "Success", {
        description,
        ...props,
      });
    }
  };

  return {
    toast,
    dismiss: () => {},
    toasts: [],
  };
}
