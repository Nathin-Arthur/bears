import type { Metadata } from "next"
import Image from "next/image"

import { cn } from "@workspace/ui/lib/utils"

import { CountUp, CountUpProgress } from "@/components/count-up"

import {
  GOAL_POINTS,
  PRIMETIME_NAMES,
  GOAL_PPG,
  REVALIDATE_SECONDS,
  TOTAL_GAMES,
  getSeasonStats,
  type Game,
  type Primetime,
  type SeasonStats,
} from "@/lib/bears"

export const revalidate = REVALIDATE_SECONDS

export const metadata: Metadata = {
  title: "Bears Points Tracker",
  description: `Tracking the Chicago Bears' chase for ${GOAL_POINTS} points in a season.`,
}

const shortDate = new Intl.DateTimeFormat("en-US", {
  month: "numeric",
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
    <main className="mx-auto flex min-h-svh w-full max-w-4xl flex-col items-center justify-center gap-[clamp(1.25rem,4svh,3.5rem)] px-4 py-[clamp(1rem,4svh,2.5rem)]">
      <Image
        src="/bears-logo.svg"
        alt="Chicago Bears"
        width={373}
        height={248}
        priority
        unoptimized
        className="h-auto w-[clamp(3.5rem,9svh,6rem)]"
      />

      {stats ? (
        <>
          <Total stats={stats} />
          <StatRow stats={stats} />
          <Games games={stats.games} />
        </>
      ) : (
        <p className="text-muted-foreground">
          Couldn&apos;t load the latest Bears scores. Try again in a few
          minutes.
        </p>
      )}
    </main>
  )
}

function Total({ stats }: { stats: SeasonStats }) {
  return (
    <section className="flex w-full flex-col items-center gap-[clamp(0.5rem,2svh,1.25rem)] text-center">
      <h1 className="sr-only">Total points scored</h1>
      <div className="flex flex-col items-center">
        <CountUp
          value={stats.totalPoints}
          className="font-numbers text-[clamp(5.5rem,min(40vw,24svh),19rem)] leading-[0.8] tabular-nums"
        />
        <span className="mt-1 text-lg text-muted-foreground sm:text-xl">
          of {GOAL_POINTS} points
        </span>
      </div>
      <CountUpProgress
        value={stats.percentComplete}
        aria-label={`Progress toward ${GOAL_POINTS} points`}
        className="w-full max-w-md [&_[data-slot=progress-track]]:h-1.5 [&_[data-slot=progress-track]]:rounded-full"
      />
      {stats.gamesPlayed > 0 && (
        <p className="flex items-center gap-2 text-sm font-medium">
          <span
            aria-hidden
            className={cn(
              "size-2 rounded-full",
              stats.onPace ? "bg-primary" : "bg-muted-foreground"
            )}
          />
          {stats.onPace ? "On record pace" : "Behind record pace"}
        </p>
      )}
    </section>
  )
}

function StatRow({ stats }: { stats: SeasonStats }) {
  const noGamesYet = stats.gamesPlayed === 0

  return (
    <dl className="grid w-full grid-cols-4 gap-x-2 text-center sm:gap-x-6">
      <Stat
        label="Pace"
        value={noGamesYet ? null : stats.pace}
        note={`over ${TOTAL_GAMES} games`}
      />
      <Stat
        label="Per game"
        value={noGamesYet ? null : stats.pointsPerGame}
        decimals={1}
        note={`goal ${GOAL_PPG}`}
      />
      <Stat
        label="Needed per game"
        value={stats.neededPerGame}
        decimals={1}
        note={
          stats.gamesRemaining === 0
            ? "season over"
            : `${stats.gamesRemaining} ${stats.gamesRemaining === 1 ? "game" : "games"} left`
        }
      />
      <Stat
        label="Points away"
        value={stats.pointsAway}
        note={stats.pointsAway === 0 ? "goal reached" : `from ${GOAL_POINTS}`}
      />
    </dl>
  )
}

function Stat({
  label,
  value,
  decimals = 0,
  note,
}: {
  label: string
  value: number | null
  decimals?: number
  note: string
}) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <dt className="flex min-h-[2lh] items-end justify-center text-[10px] leading-tight tracking-wide text-muted-foreground uppercase sm:min-h-0 sm:text-xs">
        {label}
      </dt>
      <dd className="font-numbers text-3xl leading-none tabular-nums sm:text-5xl">
        {value === null ? "—" : <CountUp value={value} decimals={decimals} />}
      </dd>
      <dd className="text-[10px] text-muted-foreground sm:text-xs">{note}</dd>
    </div>
  )
}

function Games({ games }: { games: Game[] }) {
  return (
    <section className="flex w-full flex-col items-center gap-[clamp(0.75rem,2.5svh,1.5rem)]">
      <h2 className="text-xs tracking-wide text-muted-foreground uppercase">
        Game by game
      </h2>
      <ol className="flex w-full flex-wrap justify-center gap-y-[clamp(0.5rem,2svh,1.25rem)]">
        {games.map((game) => (
          <GameItem key={game.week} game={game} />
        ))}
      </ol>
    </section>
  )
}

function GameItem({ game }: { game: Game }) {
  const upcoming = game.status === "scheduled"
  const date = game.timeKnown ? shortDate.format(new Date(game.date)) : "TBD"
  const matchup = `${game.home ? "vs" : "at"} ${game.opponentName}`
  const primetime = game.primetime ? `, ${PRIMETIME_NAMES[game.primetime]}` : ""
  const label = upcoming
    ? `Week ${game.week}, ${matchup}, ${date}${primetime}`
    : `Week ${game.week}, ${matchup}${primetime}: Bears ${game.bearsScore}, ${game.opponent} ${game.opponentScore}${game.status === "live" ? " (live)" : ""}`

  return (
    <li className="flex w-1/9 flex-col items-center gap-1" aria-label={label}>
      <div
        className={cn(
          "relative size-7 sm:size-10",
          upcoming && "opacity-30 grayscale"
        )}
      >
        <Image
          src={game.opponentLogo}
          alt=""
          fill
          sizes="48px"
          className="object-contain dark:hidden"
        />
        <Image
          src={game.opponentLogoDark}
          alt=""
          fill
          sizes="48px"
          className="hidden object-contain dark:block"
        />
      </div>
      {upcoming ? (
        <span className="flex h-5 items-center text-[10px] text-muted-foreground tabular-nums sm:h-6 sm:text-xs">
          {date}
        </span>
      ) : (
        <span
          className={cn(
            "flex h-5 items-center font-numbers text-lg leading-none tabular-nums sm:h-6 sm:text-2xl",
            game.status === "live" && "text-primary"
          )}
        >
          <CountUp value={game.bearsScore ?? 0} />
        </span>
      )}
      <span className="flex h-3.5 items-center">
        {game.primetime && <PrimetimeBadge slot={game.primetime} />}
      </span>
    </li>
  )
}

function PrimetimeBadge({ slot }: { slot: Primetime }) {
  return (
    <span
      aria-hidden
      className="rounded-[3px] border border-primary px-1 text-[9px] leading-[12px] font-bold tracking-wider text-foreground sm:text-[10px]"
    >
      {slot}
    </span>
  )
}
