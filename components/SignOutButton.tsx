
import { signOut } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"

export function SignOutButton() {
    return (
        <form
            action={async () => {
                "use server"
                await signOut()
            }}
        >
            <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Log Out
            </Button>
        </form>
    )
}
