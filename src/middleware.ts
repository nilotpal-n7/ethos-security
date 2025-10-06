import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
    const token = await getToken({req: request})
    const url = request.nextUrl
    const isAuth = !!token

    const isAuthPage = ['/sign-in', '/sign-up']
    .some((path) => url.pathname.startsWith(path))

    if(isAuth && isAuthPage) {
        return NextResponse.redirect(new URL(`/dashboard`, request.url))
    }

    if(!isAuth && url.pathname.startsWith('/dashboard')) {
        return NextResponse.redirect(new URL('/sign-in', request.url))
    }

    console.log("Middleware nextUrl", url)
    return NextResponse.next()
}

export const config = {
    matcher: [
        '/sign-in',
        '/sign-up',
        '/dashboard',
    ]
}
