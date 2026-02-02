import { Button } from "@/components/ui/button"
import { ComponentProps } from "react"
import Link from "next/link"

type SignInButtonProps = {
    provider?: string
    redirectTo?: string
    children?: React.ReactNode
} & ComponentProps<typeof Button>

export function SignInButton({
    provider = "google",
    redirectTo = "/dashboard",
    children,
    className,
    variant = "ghost",
    ...props
}: SignInButtonProps) {
    // Construct returnTo URL if redirectTo is provided
    const returnToParam = redirectTo ? `&returnTo=${encodeURIComponent(redirectTo)}` : "";

    // Use connection param to force Google if provider is google, otherwise let Auth0 decide or use default
    const connectionParam = provider === "google" ? "connection=google-oauth2" : "";

    const loginUrl = `/auth/login?${connectionParam}${returnToParam}`;

    return (
        <Link href={loginUrl}>
            <Button variant={variant} className={className} {...props}>
                {children ? children : (
                    <>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="h-4 w-4 mr-2"
                        >
                            <path
                                d="M20.283 10.356h-8.327v3.451h4.792c-.446 2.193-2.313 3.453-4.792 3.453a5.27 5.27 0 0 1-5.279-5.28 5.27 5.27 0 0 1 5.279-5.279c1.259 0 2.397.447 3.29 1.178l2.6-2.599c-1.584-1.381-3.615-2.233-5.89-2.233a8.908 8.908 0 0 0-8.934 8.934 8.908 8.908 0 0 0 8.934 8.934c4.467 0 8.529-3.249 8.529-8.934 0-.528-.081-1.097-.202-1.625z"
                            />
                        </svg>
                        Sign in with Google
                    </>
                )}
            </Button>
        </Link>
    )
}
