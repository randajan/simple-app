import { mainLogger, createLogger } from "../tools/logger";
import info from "./info";

export const log = mainLogger(info?.name, info?.version);
export default log;

export { mainLogger, createLogger }