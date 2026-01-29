# Название задания: Manager
Автор: KArtikLESS
## Описание задания:
A client asked me to perform security assessment on this password management application. Can you help me?
## Ссылка на задание:
https://app.hackthebox.com/challenges/Manager
# Решение:
Для решения этого задания необходимо скачать файл Manager.zip, который содержит необходимый для исследования .apk файл.

Команда для распаковки:
> unzip Manager.zip

В архиве помимо apk файла хранились также и дополнительные сведения:
> 1. Install this application in an API Level 29 or earlier (i.e. Android 10.0 (Google APIs)).
> 2. In order to connect to the server when first running the application, insert the IP and PORT that you are provided in the description.

Для работы с данным приложением в Android Studio был установлен эмулятор Pixel 3a с API 29.
> Запустив приложение на эмуляторе, отображалась страница с просьбой ввести адрес и порт сервера:
<img width="364" height="766" alt="image" src="https://github.com/user-attachments/assets/f425f108-d692-499f-ab11-32e3bdec4658" />

Адрес и порт сервера выдавались на страницы с заданием на сайте HackTheBox.
> После ввода данных переход происходил на страницу с просьбой залогиниться:

<img width="328" height="644" alt="image" src="https://github.com/user-attachments/assets/e89efac2-7377-4834-95a9-35019a501967" />

Однако перед заходом необходимо создать пользователя в локальной базе данных. Иначе выводилось сообщение о его отсутствии:

<img width="338" height="686" alt="image" src="https://github.com/user-attachments/assets/7173677c-7b4e-49bf-a967-9737bebc52bc" />

> Страница с регистрацией:
<img width="341" height="707" alt="image" src="https://github.com/user-attachments/assets/754ad136-632b-4d5d-a024-de92e79d2931" />

После успешной регистрации происходил переброс на страницу с менеджментом пароля.
На этой странице можно было изменить пароль, введённый при регистрации, а также высвечивались id пользователей, зарегистрированных в бд, а также роль пользователя.

<img width="336" height="680" alt="image" src="https://github.com/user-attachments/assets/cec902da-ede5-42ad-892f-90dba38c5443" />

Нажав на кнопку update, происходил переброс на страницу с вводом логина и пароля.
При вводе данных добаленного пользователя происходил переход вновь на страницу в менеджером пароля.
Итак, для подробного анализа происходящего следовало провести статический анализ кода приложения.

## Статический анализ приложения:

Для проверки статически можно использовать декомпилятор JADX.
Для начала стоит обратить внимание на файл манифеста: `AndroidManifest.xml`.
> Содержимое файла манифеста:
```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    android:versionCode="1"
    android:versionName="1.0"
    android:compileSdkVersion="31"
    android:compileSdkVersionCodename="12"
    package="com.example.manager"
    platformBuildVersionCode="31"
    platformBuildVersionName="12">
    <uses-sdk
        android:minSdkVersion="21"
        android:targetSdkVersion="31"/>
    <uses-permission android:name="android.permission.INTERNET"/>
    <application
        android:theme="@style/Theme.Manager"
        android:label="@string/app_name"
        android:icon="@mipmap/ic_launcher"
        android:allowBackup="true"
        android:supportsRtl="true"
        android:usesCleartextTraffic="true"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:appComponentFactory="androidx.core.app.CoreComponentFactory">
        <activity
            android:name="com.example.manager.MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN"/>
                <category android:name="android.intent.category.LAUNCHER"/>
            </intent-filter>
        </activity>
        <activity android:name="com.example.manager.LoginActivity"/>
        <activity android:name="com.example.manager.RegisterActivity"/>
        <activity android:name="com.example.manager.EditActivity"/>
        <provider
            android:name="androidx.startup.InitializationProvider"
            android:exported="false"
            android:authorities="com.example.manager.androidx-startup">
            <meta-data
                android:name="androidx.emoji2.text.EmojiCompatInitializer"
                android:value="androidx.startup"/>
            <meta-data
                android:name="androidx.lifecycle.ProcessLifecycleInitializer"
                android:value="androidx.startup"/>
        </provider>
    </application>
</manifest>
```

Из файла видно, что в `MainActivity` есть три основных активности: `LoginActivity`, `RegisterActivity`, `EditActivity`, где последняя активность явно наш менеджер пароля.
Из основной активности видно, что обращение происходит к сайту по протоколу `http`.

```java
public class MainActivity extends AppCompatActivity {
    /* JADX INFO: Access modifiers changed from: protected */
    @Override // androidx.fragment.app.FragmentActivity, androidx.activity.ComponentActivity, androidx.core.app.ComponentActivity, android.app.Activity
    public void onCreate(Bundle bundle) {
        super.onCreate(bundle);
        setContentView(R.layout.activity_main);
        final EditText editText = (EditText) findViewById(R.id.etIP);
        final EditText editText2 = (EditText) findViewById(R.id.etPort);
        ((Button) findViewById(R.id.btnConnect)).setOnClickListener(new View.OnClickListener() { // from class: com.example.manager.MainActivity.1
            @Override // android.view.View.OnClickListener
            public void onClick(View view) {
                String str = "http://" + editText.getText().toString() + ":" + editText2.getText().toString() + "/";
                Intent intent = new Intent(MainActivity.this, (Class<?>) LoginActivity.class);
                intent.putExtra("url", str);
                MainActivity.this.startActivity(intent);
            }
        });
    }
}
```

Анализ логина и регистрации ничего толкового не дал, однако в активности менеджера паролей роли явно в коде не были прописаны. То есть, роль задаётся непосредственно сервером, также как и id пользователя. Это и натолкнуло на мысль, что флаг хранится либо в роли пользователя, либо в его id.

```java
public void update() throws IOException {
        String str = this.url + "manage.php";
        HttpURLConnection httpURLConnection = (HttpURLConnection) new URL(str).openConnection();
        httpURLConnection.setRequestMethod("POST");
        httpURLConnection.setRequestProperty("User-Agent", "Mozilla/5.0");
        httpURLConnection.setRequestProperty("Accept-Language", "en-US,en;q=0.5");
        String str2 = "username=" + this.tvUsername.getText().toString() + "&password=" + this.etPassword.getText().toString();
        httpURLConnection.setDoOutput(true);
        DataOutputStream dataOutputStream = new DataOutputStream(httpURLConnection.getOutputStream());
}
```

## Динамический анализ приложения:
Для проведения анализа в динамике использовать можно программу Burp Suite с целью перехвата и модификации трафика. Стоит отметить, что на новых версиях Android проверка самоподписанного сертификата не проходит и необходимо в динамике обходить SSL Pinning.
Я использовал для этого метод, описанный в данной статье: https://securitygrind.com/bypassing-android-ssl-pinning-with-frida/

Сразу можно предупредить, что также понадобится и фреймворк `Frida` для реализации обхода, поэтому стоит также рутануть эмулятор. 
Можно использовать данную утилиту для получения рут прав: https://github.com/newbit1/rootAVD.

> Перехватив ответ на POST запрос при регистрации увидим то, что сервер действительно возвращает роль сам:
<img width="1564" height="343" alt="image" src="https://github.com/user-attachments/assets/2e62872c-e883-4dd8-a941-dbe9951c684a" />

Теперь осталось попытаться найти логику того, кому выдаётся роль не member...
При попытки обратитья к базе данных через SQL-инъекции, ничего не получалось. Однако было замечено, что в самом начале работы с программой она выдавала id=1, хотя база пользователей ещё даже не заполнялась, что скорее всего говорило о том, что какой-то пользователь уже был добавлен до первой регистрации.
 И это оказалось действительно так. Им оказался пользователь `admin`.

 Теперь изменим имя пользователя на `admin` и оставим пароль как `123`. Затем нажимаем "Далее" (Forward) в Burp Suite. В приложении мы получаем сообщение "Пароль успешно обновлен", и в то же время нас перенаправляет на экран входа в систему.

<img width="780" height="498" alt="image" src="https://github.com/user-attachments/assets/5e124c30-e81f-4060-8789-83675d3ea0b4" /><img width="770" height="469" alt="image" src="https://github.com/user-attachments/assets/9a94d9e4-5a61-4658-b166-08f7dc6b3a52" />

При заходе обратно в менеджер заметим, что для admin стоит роль, которая и является нашим флагом.

<img width="502" height="810" alt="Снимок экрана 2026-01-30 024011" src="https://github.com/user-attachments/assets/db79ce97-6803-4e54-9f9f-70ab0edc0310" />

Флаг: HTB{b4d_p@ss_m4n@g3m3nT_@pp}
