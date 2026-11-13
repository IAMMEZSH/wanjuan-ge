plugins {
    id("com.android.application")
}

android {
    namespace = "ge.wanjuan.reader"
    compileSdk = 34

    defaultConfig {
        applicationId = "ge.wanjuan.reader"
        minSdk = 24
        targetSdk = 34
        versionCode = 2
        versionName = "1.1.0"

        // 默认地址：手机本机运行的万卷阁服务（例如 Termux）。
        // 若服务在电脑上，请改成电脑的局域网地址，例如：
        //   buildConfigField("String", "SERVER_URL", "\"http://192.168.1.20:7410\"")
        // 也可以在 App 内“服务器地址”菜单中随时修改。
        buildConfigField("String", "SERVER_URL", "\"http://127.0.0.1:7410\"")
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    buildFeatures {
        buildConfig = true
    }
}
