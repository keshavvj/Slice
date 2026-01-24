
"use server"

import { signIn } from "@/lib/auth"

export async function doSignIn(provider: string = "google", redirectTo: string = "/dashboard") {
    await signIn(provider, { redirectTo })
}
