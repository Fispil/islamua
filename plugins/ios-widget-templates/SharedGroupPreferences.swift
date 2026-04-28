// ios/islamua/SharedGroupPreferences.swift
// React Native ↔ App Group UserDefaults bridge.
// JS calls SharedGroupPreferences.setItem(key, json, group) →
// data lands in App Group UserDefaults → WidgetKit extension reads it.

import Foundation
import WidgetKit

@objc(SharedGroupPreferences)
class SharedGroupPreferences: NSObject {

    @objc
    func setItem(
        _ key: String,
        value: String,
        suiteName: String,
        resolve: @escaping RCTPromiseResolveBlock,
        reject: @escaping RCTPromiseRejectBlock
    ) {
        guard let defaults = UserDefaults(suiteName: suiteName) else {
            reject("ERR_APP_GROUP", "Cannot open App Group: \(suiteName)", nil)
            return
        }
        defaults.set(value, forKey: key)
        defaults.synchronize()
        resolve(true)
    }

    @objc
    func reloadAllTimelines() {
        if #available(iOS 14.0, *) {
            WidgetCenter.shared.reloadAllTimelines()
        }
    }

    @objc static func requiresMainQueueSetup() -> Bool { return false }
}
