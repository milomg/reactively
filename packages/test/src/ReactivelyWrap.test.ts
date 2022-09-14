import { reactivelyWrap } from './util/ReactivelyWrapFramework';
import { staticTests } from "./StaticPatterns";
import { performanceTests } from './PerformancePatterns';

staticTests(reactivelyWrap);
performanceTests(reactivelyWrap);