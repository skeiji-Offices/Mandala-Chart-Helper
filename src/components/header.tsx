'use client'

import { signIn, signOut, useSession } from "next-auth/react"
import Link from "next/link"

export function Header() {
    const { data: session } = useSession()

    return (
        <header className="flex items-center justify-between p-4 border-b bg-white shadow-sm relative">
            <div className="absolute left-1/2 transform -translate-x-1/2">
                <Link href="/" className="text-xl font-bold text-blue-600">
                    Mandala Chart Helper
                </Link>
            </div>

            {/* Spacer to keep layout balanced if needed, or just keep the auth button on the right */}
            <div className="w-10"></div>

            <div className="ml-auto">
                {session ? (
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-600 hidden sm:block">
                            {session.user?.name}
                        </span>
                        {session.user?.image && (
                            <img
                                src={session.user.image}
                                alt="User Avatar"
                                className="w-8 h-8 rounded-full"
                            />
                        )}
                        <button
                            onClick={() => signOut()}
                            className="text-sm text-red-500 hover:underline"
                        >
                            ログアウト
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => signIn("google")}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                    >
                        Googleでログイン
                    </button>
                )}
            </div>
        </header>
    )
}
