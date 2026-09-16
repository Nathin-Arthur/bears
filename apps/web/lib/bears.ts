export const GOAL_POINTS = 646
export const TOTAL_GAMES = 17
export const GOAL_PPG = GOAL_POINTS / TOTAL_GAMES

// Refresh the ESPN data at most every 15 minutes.
export const REVALIDATE_SECONDS = 900

const TEAM = "chi"

export type GameStatus = "final" | "live" | "scheduled"

export type Primetime = "TNF" | "SNF" | "MNF"

export const PRIMETIME_NAMES: Record<Primetime, string> = {
  TNF: "Thursday Night Football",
  SNF: "Sunday Night Football",
  MNF: "Monday Night Football",
}

export type Game = {
  week: number
  date: string
  timeKnown: boolean
  primetime: Primetime | null
  opponent: string
  opponentName: string
  opponentLogo: string
  opponentLogoDark: string
  home: boolean
  status: GameStatus
  bearsScore: number | null
  opponentScore: number | null
}

export type SeasonStats = {
  season: number
  games: Game[]
  gamesPlayed: number
  gamesRemaining: number
  totalPoints: number
  pointsPerGame: number
  pace: number
  neededPerGame: number | null
  pointsAway: number
  percentComplete: number
  onPace: boolean
}

type EspnCompetitor = {
  homeAway: "home" | "away"
  team: {
    abbreviation: string
    displayName: string
    logos?: { href: string; rel: string[] }[]
  }
  score?: { value: number }
}

type EspnEvent = {
  date: string
  week: { number: number }
  competitions: {
    competitors: EspnCompetitor[]
    timeValid?: boolean
    status: { type: { state: "pre" | "in" | "post"; completed: boolean } }
  }[]
}

// The NFL season starts in September and ends in early February, so
// January–July still belong to the previous year's season.
export function currentSeason(now = new Date()) {
  return now.getMonth() < 7 ? now.getFullYear() - 1 : now.getFullYear()
}

export async function getSeasonStats(
  season = currentSeason()
): Promise<SeasonStats> {
  // seasontype=2 is the regular season, so playoff games are never counted.
  const url = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${TEAM}/schedule?season=${season}&seasontype=2`
  const res = await fetch(url, { next: { revalidate: REVALIDATE_SECONDS } })
  if (!res.ok) {
    throw new Error(`ESPN request failed with status ${res.status}`)
  }
  const data: { events?: EspnEvent[] } = await res.json()

  const games = (data.events ?? []).map(toGame)
  return computeStats(season, games)
}

function toGame(event: EspnEvent): Game {
  const competition = event.competitions[0]!
  const bears = competition.competitors.find(
    (c) => c.team.abbreviation.toLowerCase() === TEAM
  )!
  const opponent = competition.competitors.find((c) => c !== bears)!
  const { state, completed } = competition.status.type

  const status: GameStatus = completed
    ? "final"
    : state === "in"
      ? "live"
      : "scheduled"

  const timeKnown = competition.timeValid !== false

  return {
    week: event.week.number,
    date: event.date,
    timeKnown,
    primetime: timeKnown ? primetimeSlot(event.date) : null,
    opponent: opponent.team.abbreviation,
    opponentName: opponent.team.displayName,
    opponentLogo: logoUrl(opponent, false),
    opponentLogoDark: logoUrl(opponent, true),
    home: bears.homeAway === "home",
    status,
    bearsScore: status === "scheduled" ? null : (bears.score?.value ?? 0),
    opponentScore: status === "scheduled" ? null : (opponent.score?.value ?? 0),
  }
}

const chicagoKickoff = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  hour: "numeric",
  hourCycle: "h23",
  timeZone: "America/Chicago",
})

// Standalone night games kick off after 6 PM Central on Thursday, Sunday or
// Monday. Thanksgiving and other daytime Thursday games don't count.
function primetimeSlot(date: string): Primetime | null {
  const parts = chicagoKickoff.formatToParts(new Date(date))
  const weekday = parts.find((p) => p.type === "weekday")?.value
  const hour = Number(parts.find((p) => p.type === "hour")?.value)
  if (hour < 18) return null
  if (weekday === "Thu") return "TNF"
  if (weekday === "Sun") return "SNF"
  if (weekday === "Mon") return "MNF"
  return null
}

// Prefer ESPN's "scoreboard" logos, which are drawn for small sizes.
function logoUrl(competitor: EspnCompetitor, dark: boolean) {
  const logos = competitor.team.logos ?? []
  const match = logos.find(
    (l) => l.rel.includes("scoreboard") && l.rel.includes("dark") === dark
  )
  const abbr = competitor.team.abbreviation.toLowerCase()
  return (
    match?.href ??
    `https://a.espncdn.com/i/teamlogos/nfl/${dark ? "500-dark" : "500"}/scoreboard/${abbr}.png`
  )
}

export function computeStats(season: number, games: Game[]): SeasonStats {
  // Only finished games count toward the totals.
  const finals = games.filter((g) => g.status === "final")
  const gamesPlayed = finals.length
  const gamesRemaining = TOTAL_GAMES - gamesPlayed
  const totalPoints = finals.reduce((sum, g) => sum + (g.bearsScore ?? 0), 0)
  const pointsPerGame = gamesPlayed > 0 ? totalPoints / gamesPlayed : 0
  const pace = pointsPerGame * TOTAL_GAMES
  const pointsAway = Math.max(GOAL_POINTS - totalPoints, 0)
  const neededPerGame = gamesRemaining > 0 ? pointsAway / gamesRemaining : null

  return {
    season,
    games,
    gamesPlayed,
    gamesRemaining,
    totalPoints,
    pointsPerGame,
    pace,
    neededPerGame,
    pointsAway,
    percentComplete: Math.min((totalPoints / GOAL_POINTS) * 100, 100),
    onPace: gamesPlayed > 0 && pace >= GOAL_POINTS,
  }
}
