import { performanceTests } from "./PerformancePatterns";
import { staticTests } from "./StaticPatterns";
import { solidFramework } from "./util/SolidFramework";

staticTests(solidFramework);
performanceTests(solidFramework);