"use client";

import { useTranslations } from "next-intl";
import { useHaptics } from "@/components/haptics-provider";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

interface ConfirmDeleteDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void;
  isPending?: boolean;
}

export function ConfirmDeleteDrawer({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  isPending,
}: ConfirmDeleteDrawerProps) {
  const { trigger } = useHaptics();
  const t = useTranslations("common");

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{title}</DrawerTitle>
          <DrawerDescription>{description}</DrawerDescription>
        </DrawerHeader>
        <DrawerFooter>
          <button
            type="button"
            disabled={isPending}
            onClick={() => {
              trigger("warning");
              onConfirm();
            }}
            className="w-full rounded-xl bg-destructive px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-destructive/90 disabled:opacity-50"
          >
            {isPending ? t("deleting") : t("delete")}
          </button>
          <DrawerClose asChild>
            <button
              type="button"
              className="w-full rounded-xl bg-secondary px-4 py-3 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
            >
              {t("cancel")}
            </button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
