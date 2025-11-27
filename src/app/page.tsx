import Image from "next/image";

import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <main className="flex flex-col items-center gap-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
          マンダラメーカー
        </h1>
        <p className="max-w-xl text-lg text-gray-600">
          AIとマンダラチャートの力で目標を達成しましょう。<br />
          あなたの夢を具体的な行動に分解します。
        </p>

        <Link
          href="/create"
          className="rounded-full bg-blue-600 px-8 py-4 text-lg font-semibold text-white shadow-lg hover:bg-blue-700 transition-colors"
        >
          チャートを新規作成
        </Link>
      </main>
    </div>
  );
}
