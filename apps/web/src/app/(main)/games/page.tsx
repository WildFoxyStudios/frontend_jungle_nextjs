"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { contentApi, api } from "@jungle/api-client";
import type { Game } from "@jungle/api-client";
import { Card, CardContent, Skeleton, Badge } from "@jungle/ui";
import { Gamepad2, Users, X } from "lucide-react";
import { toast } from "sonner";

export default function GamesPage() {
	const [games, setGames] = useState<Game[]>([]);
	const [loading, setLoading] = useState(true);
	const [activeGame, setActiveGame] = useState<Game | null>(null);
	const [iframeLoading, setIframeLoading] = useState(false);

	useEffect(() => {
		contentApi.getGames()
			.then((r: unknown) => {
				const arr = Array.isArray(r) ? r : (r as Record<string, unknown>)?.data;
				setGames(Array.isArray(arr) ? arr : []);
			})
			.catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load games"))
			.finally(() => setLoading(false));
	}, []);

	const handlePlay = (game: Game) => {
		setActiveGame(game);
		setIframeLoading(true);
		// Play count is best-effort telemetry; ignore errors.
		api.post<void>(`/api/games/${game.id}/play`).catch(() => { /* silent by design */ });
	};

	const handleGameKeyDown = (e: React.KeyboardEvent, game: Game) => {
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			handlePlay(game);
		}
	};

	if (activeGame) {
		return (
			<div className="fixed inset-0 z-50 bg-background flex flex-col">
				<div className="flex items-center justify-between px-4 py-2 border-b">
					<h2 className="font-semibold">{activeGame.name}</h2>
					<button
						onClick={() => { setActiveGame(null); setIframeLoading(false); }}
						aria-label="Close game"
						className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
					>
						<X className="h-4 w-4" /> Close
					</button>
				</div>
				<div className="relative flex-1">
					{iframeLoading && (
						<div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
							<div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
						</div>
					)}
					<iframe
						src={activeGame.url}
						className="w-full h-full border-0"
						title={activeGame.name}
						sandbox="allow-scripts allow-same-origin allow-forms"
						allow="fullscreen"
						onLoad={() => setIframeLoading(false)}
					/>
				</div>
			</div>
		);
	}

	return (
		<div className="max-w-4xl mx-auto px-4 py-4 space-y-4">
			<div className="flex items-center gap-2">
				<Gamepad2 className="h-6 w-6" />
				<h1 className="text-2xl font-bold sm:text-[28px]">Games</h1>
			</div>

			{loading ? (
				<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
					{Array.from({ length: 8 }).map((_, i) => (
						<Skeleton key={i} className="h-48" />
					))}
				</div>
			) : games.length === 0 ? (
				<div className="py-12 text-center">
					<p className="text-[15px] font-semibold text-muted-foreground">No games available yet.</p>
				</div>
			) : (
				<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
					{games.map((game) => (
						<Card
							key={game.id}
							role="button"
							tabIndex={0}
							className="cursor-pointer overflow-hidden transition hover:bg-muted/50"
							onClick={() => handlePlay(game)}
							onKeyDown={(e) => handleGameKeyDown(e, game)}
						>
							<div className="relative aspect-video bg-secondary/40 border-b">
								{game.thumbnail ? (
									<Image src={game.thumbnail} alt={game.name} fill unoptimized className="object-cover" />
								) : (
									<div className="absolute inset-0 flex items-center justify-center">
										<Gamepad2 className="h-10 w-10 text-muted-foreground" />
									</div>
								)}
								{!game.is_active && (
									<Badge variant="secondary" className="absolute top-2 right-2 text-xs">
										Unavailable
									</Badge>
								)}
							</div>
							<CardContent className="p-3">
								<p className="font-semibold text-sm truncate">{game.name}</p>
								{game.play_count > 0 && (
									<p className="text-[13px] font-medium text-muted-foreground flex items-center gap-1 mt-1">
										<Users className="h-3 w-3" />
										{game.play_count.toLocaleString()} plays
									</p>
								)}
							</CardContent>
						</Card>
					))}
				</div>
			)}
		</div>
	);
}
