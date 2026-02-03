# Название задания: Waiting
Автор: KArtikLESS
## Описание задания:
The app stores a secret and says it is stored securely even in case the application has been tampered. Are you able to retrieve it?
## Ссылка на задание:
https://app.hackthebox.com/challenges/Waiting
# Решение:
Для решения этого задания необходимо скачать файл Waiting.zip, который содержит необходимый для исследования .apk файл.

Команда для распаковки:
> unzip Waiting.zip

Затем после распакови данное приложение было запущенно на эмуляторе Pixel 3a (API 29) в Android Studio. 
\
\
Оно представляло собой генератор уникальных токенов для каждого нового пользователя. При запуске на экран выводилась базовая информация об функциях приложения. 

> Интерфейс стартового экрана:
<img width="417" height="812" alt="Снимок экрана 2026-02-03 223921" src="https://github.com/user-attachments/assets/98a419dc-cdc7-4522-86ef-598768db653c" />

При нажатии кнопки `Generator` происходил непосредственный переход к функциям приложения.

> Полезный функционал:
<img width="415" height="812" alt="Снимок экрана 2026-02-03 223936" src="https://github.com/user-attachments/assets/057c0390-5249-46ed-9e43-34b734b69aa3" />

При заполнении всех полей можно было сгенерировать токен.

> Генерация токена:
<img width="417" height="817" alt="Снимок экрана 2026-02-03 223953" src="https://github.com/user-attachments/assets/ec928456-d518-40f9-8db0-8a39cc5c7b72" />

Итак, в первую очередь стоит обратить внимание на то, что кнопка `Full access` заблокирована. Теперь стоит декомпилировать приложение и посмотреть его возможности "изнутри".

## Статический анализ приложения:
Для декомпиляции можно использовать утилиту JADX. Для начала стоит посмотреть какие в приложении существуют активности. 
При анализе файла манифеста `AndroidManifest.xml` было выяснено, что в приложении существуют три активности, одна из которых называется `SecretActivity`, что намекнуло на некоторую скрытую бизнес-логику приложения.

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    android:versionCode="1"
    android:versionName="1.0"
    android:compileSdkVersion="31"
    android:compileSdkVersionCodename="12"
    package="com.example.waiting"
    platformBuildVersionCode="31"
    platformBuildVersionName="12">
    <uses-sdk
        android:minSdkVersion="22"
        android:targetSdkVersion="31"/>
    <application
        android:theme="@style/Theme.HTBChallenge1"
        android:label="@string/app_name"
        android:icon="@mipmap/ic_launcher"
        android:allowBackup="true"
        android:supportsRtl="true"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:appComponentFactory="android.support.v4.app.CoreComponentFactory">
        <activity
            android:name="com.example.waiting.MainActivity"
            android:exported="true"
            android:launchMode="singleTop">
            <intent-filter>
                <action android:name="android.intent.action.MAIN"/>
                <category android:name="android.intent.category.LAUNCHER"/>
            </intent-filter>
        </activity>
        <activity
            android:name="com.example.waiting.MenuActivity"
            android:exported="false"
            android:launchMode="singleTop">
            <intent-filter>
                <action android:name="com.example.waiting.MENU_ACTION"/>
                <category android:name="android.intent.category.DEFAULT"/>
            </intent-filter>
        </activity>
        <activity
            android:name="com.example.waiting.SecretActivity"
            android:exported="false"/>
    </application>
</manifest>
```

Анализ `MainActvity` дал понять, что вызов `MenuActivity` происходит только в случае, если проиходит какое-то действие от broadcast receiver. Действие откладывается на 5 секунд.

```java
protected void onPause() {
  super.onPause();
  Intent intent=new Intent(this,MenuActivity.class);
  intent.setAction("com.example.waiting.MENU_ACTION");
  PendingIntent activity=PendingIntent.getActivity(this,0,intent,33554432);
  final Intent intent2=new Intent();
  intent2.setAction("com.example.waiting.RECEIVED");
  intent2.putExtra("com.example.waiting.INTENT",activity);
  final Handler handler=new Handler();
  handler.postDelayed(new RunnableC04701(this,intent2,handler),5000);
}
```

Более глубокий анализ показал, что `C0476c.m3841a(this)` - это анти-отладочная проверка. Если `C0476c.m3841a(this)` бросит исключение → переход в L8 → через 5 секунд выполнится `m3828k()`:

```java
private /* synthetic */ void m3828k() {
    finishAndRemoveTask();
    System.exit(0);
}

protected void onCreate(Bundle bundle){
    super.onCreate(bundle);
  L3:
    setContentView(R.layout.activity_main);
    C0476c.m3842b(this.f4983j);
    C0476c.m3841a(this);
    f4982k=C0311a.j.f3384aR;
    if(((((C0311a.j.f3384aR*C0311a.j.f3384aR)+C0311a.j.f3384aR)+7)%81)==0)goto L3;
  L9:
    ((Button)findViewById(R.id.button_menu)).setOnClickListener(new MainActivity$$ExternalSyntheticLambda0(this));
    return;
  L8:
    Runnable runnable=new MainActivity$$ExternalSyntheticLambda1(this);
    new Handler().postDelayed(runnable,5000);
    goto L9;
}
```

Здесь стоит отметить, что точно такие же защиты есть и в активностях `MenuActivity` и `SecretActivity`.\
Далее стоило посмотреть логику `MenuActivity`.

```java
private /* synthetic */ void m3830k() {
     finishAndRemoveTask();
     System.exit(0);
}

@Override // android.support.v7.app.AppCompatActivity, android.support.v4.app.FragmentActivity, android.support.v4.app.SupportActivity, android.app.Activity
protected void onCreate(Bundle bundle) {
     super.onCreate(bundle);
     setContentView(R.layout.activity_menu);
     final TextView textView = (TextView) findViewById(R.id.text_token);
     final TextView textView2 = (TextView) findViewById(R.id.editTextPersonName);
     final TextView textView3 = (TextView) findViewById(R.id.editTextPersonSurname);
     final TextView textView4 = (TextView) findViewById(R.id.editTextPersonEmail);
     final TextView textView5 = (TextView) findViewById(R.id.editTextPersonPassword);
     final CheckBox checkBox = (CheckBox) findViewById(R.id.checkBox);
     final CheckBox checkBox2 = (CheckBox) findViewById(R.id.checkBox2);
     final CheckBox checkBox3 = (CheckBox) findViewById(R.id.checkBox3);
     ((Button) findViewById(R.id.button_get_token)).setOnClickListener(new MenuActivity$$ExternalSyntheticLambda0(textView2, textView3, textView4, textView5, checkBox, checkBox2, checkBox3, textView));
      if (getIntent().getBooleanExtra("Secret", false) == false) goto L15;
        C0476c.m3841a(this);     // Catch: C0469a.a -> L9
        Intent intent = new Intent(this, SecretActivity.class);     // Catch: C0469a.a -> L9
    L5:
      startActivity(intent);     // Catch: C0469a.a -> L9
      f4987j = C0311a.j.f3376aJ;
      if (((((C0311a.j.f3376aJ * C0311a.j.f3376aJ) + C0311a.j.f3376aJ) + 7) % 81) == 0) goto L5;
      return;
    L9:
      Runnable runnable = new MenuActivity$$ExternalSyntheticLambda1(this);
      new Handler().postDelayed(runnable, 5000);
      return;
}
```

Чтобы попасть в блок с вызовом секретной активности, нужно чтобы выполнялось условие `getIntent().getBooleanExtra("Secret", false) == false`. Однако неизвестно, какие именно данные должны быть введены пользователем чтобы получить такой результат. Поэтому было решено провести патчинг приложения, чтобы обойти эту проверку.\

## Патчинг приложения:
С помощью утилиты `apktool` можно пропатчить smali-код активности. В директории `decompiled\smali\com\example\waiting\MenuActivity.smali` поменять стоит следующую строку:

> Команда для декомпиляции: apktool b decompiled -o modified.apk
```xml
    const-string v0, "Secret"

    const/4 v1, 0x0

    invoke-virtual {p1, v0, v1}, Landroid/content/Intent;->getBooleanExtra(Ljava/lang/String;Z)Z

    move-result p1

    # if-enz p1, :cond_0
    if-nez p1, :cond_0
```

Однако, как говорилось ранее, этого недостаточно. Необходимо также закомментить все вызовы `m3841a`, так как в противном случае приложение будет просто перезапускаться.\
Для этого в каждой из активностей необходимо закомментить данную строку `invoke-static {p0}, Lcom/example/waiting/utils/c;->a(Landroid/content/Context;)V` в представлении кода .smali.

Если этого не сделать, то приложение будет показывать такой интерфейс и перезапускаться каждые 5 секунд:
<img width="428" height="815" alt="Снимок экрана 2026-02-03 223648" src="https://github.com/user-attachments/assets/00affe60-0abd-4d63-ad44-21a698435f5e" />

Для сборки и подписания модифицированного приложения можно использовать те же команды, которые уже были использованы при разборе Anchored: https://github.com/KArtikLESS/HTB_TASKS/blob/main/Mobile/Anchored/README.md
\
При переустановке приложения на экран выводился флаг:

<img width="413" height="822" alt="Снимок экрана 2026-02-03 223512" src="https://github.com/user-attachments/assets/68fb0912-fbc3-4e5d-a7c0-dfefedacc39b" />
