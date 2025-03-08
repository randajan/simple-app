import { mainLogger, createLogger } from "../tools/logger";

export const log = mainLogger(info.name, info.version, info.env);
export default log;

export { mainLogger, createLogger }