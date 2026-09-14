import { useState } from "react"
import { Share } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

const STORAGE_KEY = "sunrise-install-hint-dismissed"

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator &&
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
  )
}

function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

function shouldShowHint() {
  return !isStandalone() && localStorage.getItem(STORAGE_KEY) !== "1"
}

export function InstallHint() {
  const [visible, setVisible] = useState(shouldShowHint)

  if (!visible) {
    return null
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <div>
          <p className="text-sm font-medium">Install Sunrise on your phone</p>
          <p className="mt-1 text-sm leading-5 text-muted-foreground">
            {isIos()
              ? "In Safari, tap Share, then Add to Home Screen. It opens like an app, without the browser chrome."
              : "Use your browser menu and choose Install app or Add to Home Screen."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Share className="size-4 text-muted-foreground" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="ml-auto"
            onClick={() => {
              localStorage.setItem(STORAGE_KEY, "1")
              setVisible(false)
            }}
          >
            Got it
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
