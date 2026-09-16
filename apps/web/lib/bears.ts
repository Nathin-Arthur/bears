export const GOAL_POINTS = 646
export const TOTAL_GAMES = 17
export const GOAL_PPG = GOAL_POINTS / TOTAL_GAMES

// Refresh the ESPN data at most every 15 minutes.
export const REVALIDATE_SECONDS = 900

const TEAM = "chi"

export type GameStatus = "final" | "live" | "scheduled"

export type Game = {
  week: number
  date: string
  opponent: string
  opponentName: string
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
  team: { abbreviation: string; displayName: string }
  score?: { value: number }
}

type EspnEvent = {
  date: string
  week: { number: number }
  competitions: {
    competitors: EspnCompetitor[]
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

  return {
    week: event.week.number,
    date: event.date,
    opponent: opponent.team.abbreviation,
    opponentName: opponent.team.displayName,
    home: bears.homeAway === "home",
    status,
    bearsScore: status === "scheduled" ? null : (bears.score?.value ?? 0),
    opponentScore: status === "scheduled" ? null : (opponent.score?.value ?? 0),
  }
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
