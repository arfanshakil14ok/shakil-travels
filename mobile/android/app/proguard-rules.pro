# Flutter wrapper Proguard rules
-keep class io.flutter.app.** { *; }
-keep class io.flutter.plugin.**  { *; }
-keep class io.flutter.util.**  { *; }
-keep class io.flutter.view.**  { *; }
-keep class io.flutter.**  { *; }
-keep class io.flutter.plugins.**  { *; }

# Flutter Secure Storage
-keep class com.it_nomads.fluttersecurestorage.** { *; }

# Gson / JSON models if needed
-keepattributes *Annotation*
-keepattributes Signature
-keepattributes InnerClasses
-dontwarn java.lang.invoke.**
-dontwarn javax.annotation.**
