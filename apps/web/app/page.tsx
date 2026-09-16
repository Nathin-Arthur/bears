import type { Metadata } from "next"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Progress } from "@workspace/ui/components/progress"
import { cn } from "@workspace/ui/lib/utils"

import {
  GOAL_POINTS,
  GOAL_PPG,
  REVALIDATE_SECONDS,
  TOTAL_GAMES,
  getSeasonStats,
  type Game,
  type SeasonStats,
} from "@/lib/bears"

export const revalidate = REVALIDATE_SECONDS

export const metadata: Metadata = {
  title: "Bears Points Tracker",
  description: `Tracking the Chicago Bears' chase for ${GOAL_POINTS} points in a season.`,
}

const whole = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 })
const oneDecimal = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})
const gameDate = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "America/Chicago",
})

export default async function Page() {
  let stats: SeasonStats | null = null
  try {
    stats = await getSeasonStats()
  } catch (error) {
    console.error(error)
  }

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-16">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-semibold tracking-widest text-primary uppercase">
          Chicago Bears{stats ? ` · ${stats.season} season` : ""}
        </p>
        <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          The {GOAL_POINTS}-point chase
        </h1>
        <p className="max-w-xl text-muted-foreground">
          Averaging {GOAL_PPG} points a game over {TOTAL_GAMES} games would
          break the NFL record for points per game in a season.
        </p>
      </header>

      {stats ? <Tracker stats={stats} /> : <LoadError />}
    </main>
  )
}

function Tracker({ stats }: { stats: SeasonStats }) {
  const noGamesYet = stats.gamesPlayed === 0

  return (
    <>
      <Card>
        <CardHeader>
          <CardDescription>Total points scored</CardDescription>
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="font-heading text-6xl font-semibold tabular-nums sm:text-7xl">
              {whole.format(stats.totalPoints)}
            </span>
            <span className="text-2xl text-muted-foreground tabular-nums">
              / {GOAL_POINTS}
            </span>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Progress
            value={stats.percentComplete}
            aria-label="Progress toward 646 points"
            className="[&_[data-slot=progress-track]]:h-3"
          />
          <div className="flex flex-wrap justify-between gap-2 text-muted-foreground">
            <span>
              {oneDecimal.format(stats.percentComplete)}% of the goal ·{" "}
              {stats.gamesPlayed} of {TOTAL_GAMES} games played
            </span>
            {!noGamesYet && (
              <span
                className={cn(
                  "font-medium",
                  stats.onPace ? "text-primary" : "text-foreground"
                )}
              >
                {stats.onPace ? "On record pace" : "Behind record pace"}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Current pace"
          value={noGamesYet ? "—" : whole.format(stats.pace)}
          detail={`Projected points over ${TOTAL_GAMES} games`}
          highlight={stats.onPace}
        />
        <Stat
          label="Points per game"
          value={noGamesYet ? "—" : oneDecimal.format(stats.pointsPerGame)}
          detail={`Record pace is ${GOAL_PPG} per game`}
          highlight={stats.onPace}
        />
        <Stat
          label="Needed per game"
          value={
            stats.neededPerGame === null
              ? "—"
              : oneDecimal.format(stats.neededPerGame)
          }
          detail={
            stats.gamesRemaining === 0
              ? "Regular season is over"
              : `Over the final ${stats.gamesRemaining} ${stats.gamesRemaining === 1 ? "game" : "games"}`
          }
        />
        <Stat
          label="Points away"
          value={whole.format(stats.pointsAway)}
          detail={
            stats.pointsAway === 0
              ? "Goal reached"
              : `Still needed to reach ${GOAL_POINTS}`
          }
        />
      </section>

      <GameLog games={stats.games} />

      <p className="text-xs text-muted-foreground">
        Scores from ESPN, refreshed every {REVALIDATE_SECONDS / 60} minutes.
        Only completed regular-season games count toward the totals.
      </p>
    </>
  )
}

function Stat({
  label,
  value,
  detail,
  highlight = false,
}: {
  label: string
  value: string
  detail: string
  highlight?: boolean
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <span
          className={cn(
            "font-heading text-4xl font-semibold tabular-nums",
            highlight && "text-primary"
          )}
        >
          {value}
        </span>
        <span className="text-xs text-muted-foreground">{detail}</span>
      </CardHeader>
    </Card>
  )
}

function GameLog({ games }: { games: Game[] }) {
  const runningTotals = games.reduce<number[]>((totals, game) => {
    const previous = totals.at(-1) ?? 0
    const points = game.status === "final" ? (game.bearsScore ?? 0) : 0
    return [...totals, previous + points]
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Game log</CardTitle>
      </CardHeader>
      <CardContent className="-mx-2 overflow-x-auto">
        <table className="w-full min-w-[480px] text-left tabular-nums">
          <thead className="text-xs text-muted-foreground uppercase">
            <tr>
              <th className="px-2 py-2 font-medium">Wk</th>
              <th className="px-2 py-2 font-medium">Date</th>
              <th className="px-2 py-2 font-medium">Opponent</th>
              <th className="px-2 py-2 font-medium">Result</th>
              <th className="px-2 py-2 text-right font-medium">Bears pts</th>
              <th className="px-2 py-2 text-right font-medium">Season total</th>
            </tr>
          </thead>
          <tbody>
            {games.map((game, index) => {
              const upcoming = game.status === "scheduled"

              return (
                <tr
                  key={game.week}
                  className={cn(
                    "border-t border-border",
                    upcoming && "text-muted-foreground"
                  )}
                >
                  <td className="px-2 py-2.5">{game.week}</td>
                  <td className="px-2 py-2.5">
                    {gameDate.format(new Date(game.date))}
                  </td>
                  <td className="px-2 py-2.5" title={game.opponentName}>
                    {game.home ? "vs" : "@"} {game.opponent}
                  </td>
                  <td className="px-2 py-2.5">
                    <Result game={game} />
                  </td>
                  <td className="px-2 py-2.5 text-right font-medium">
                    {game.status === "final" ? game.bearsScore : "—"}
                  </td>
                  <td className="px-2 py-2.5 text-right">
                    {game.status === "final" ? runningTotals[index] : "—"}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </CardContent>
    </Card>
  )
}

function Result({ game }: { game: Game }) {
  if (game.status === "scheduled") return <span>Upcoming</span>

  const score = `${game.bearsScore}–${game.opponentScore}`
  if (game.status === "live") {
    return <span className="text-primary">Live · {score}</span>
  }

  const outcome =
    game.bearsScore! > game.opponentScore!
      ? "W"
      : game.bearsScore! < game.opponentScore!
        ? "L"
        : "T"
  return (
    <span>
      <span className="font-semibold">{outcome}</span> {score}
    </span>
  )
}

function LoadError() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Scores unavailable</CardTitle>
        <CardDescription>
          Couldn&apos;t load the latest Bears scores from ESPN. The page will
          try again on the next refresh.
        </CardDescription>
      </CardHeader>
    </Card>
  )
}
