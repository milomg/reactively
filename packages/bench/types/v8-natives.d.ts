declare module "v8-natives" {
  export interface V8 {
    isNative: () => boolean;
    collectGarbage: () => void;
    debugPrint: (data: any) => void;
    optimizeFunctionOnNextCall: (fn: Function) => void;
    getOptimizationStatus: (fn: Function) => number;
    deoptimizeFunction: (fn: Function) => void;
    deoptimizeNow: (fn: Function) => void;
    ClearFunctionFeedback: (fn: Function) => void;
    debugTrace: (fn: Function) => void;
    getHeapUsage: (fn: Function) => void;
    hasFastProperties: (fn: Function) => void;
    hasFastPackedElements: (fn: Function) => void;
    HasSmiElements: (fn: Function) => void;
    hasDoubleElements: (fn: Function) => void;
    hasDictionaryElements: (fn: Function) => void;
    HasHoleyElements: (fn: Function) => void;
    hasSmiOrObjectElements: (fn: Function) => void;
    hasSloppyArgumentsElements: (fn: Function) => void;
    haveSameMap: (fn: Function) => void;
    getFunctionName: (fn: Function) => void;
    functionGetName: (fn: Function) => void;
    isSmi: (fn: Function) => void;
    isValidSmi: (fn: Function) => void;
    neverOptimizeFunction: (fn: Function) => void;
    traceEnter: (fn: Function) => void;
    traceExit: (fn: Function) => void;
    CompileOptimized: (fn: Function) => void;
    helpers: {
      printStatus: (fn: Function) => void;
      testOptimization: (fn: Function) => void;
      benchmark: (fn: Function) => void;
    };
  }

  const v8: V8;
  export default v8;
}
