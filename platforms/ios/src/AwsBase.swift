import Foundation

fileprivate func log(_ msg: String) {
    print(msg)
}

@objc(AwsBase)
class AwsBase: CDVPlugin {
    
    lazy private var infoDict: [String : String]? = Bundle.main.infoDictionary?["CordovaAWS"] as? [String : String]
    
    override func pluginInitialize() {
        if let regionName = self.infoDict?["Region"], let poolId = self.infoDict?["CognitoPool"] {
            let region = regionName.aws_regionTypeValue()
            let provider = AWSCognitoCredentialsProvider.init(regionType: region, identityPoolId: poolId)
            let config = AWSServiceConfiguration.init(region: region, credentialsProvider: provider)
            AWSServiceManager.default().defaultServiceConfiguration = config
            log("AWSServiceManager is initialized: region=\(region)")
        }
    }
}
