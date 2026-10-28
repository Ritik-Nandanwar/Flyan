import { GameType } from "../games/engines";

/** Maps the app's supplied logo PNG assets to their respective game types. */
export const GAME_LOGOS: Record<GameType, number> = {
  worldle: require("../../game_logos/WO3.png"),
  wordle: require("../../game_logos/W3.png"),
  sudoku: require("../../game_logos/S3.png"),
  verticle: require("../../game_logos/V1.png"),
};

/** Profile avatar artwork used in the home header and profile screen. */
export const PROFILE_ICON = require("../../assets/profile icon.png");
