#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(SharedGroupPreferences, NSObject)

RCT_EXTERN_METHOD(
    setItem:(NSString *)key
    value:(NSString *)value
    suiteName:(NSString *)suiteName
    resolve:(RCTPromiseResolveBlock)resolve
    reject:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(reloadAllTimelines)

@end
