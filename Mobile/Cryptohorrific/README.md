# Название задания: Cryptohorrific
Автор: KArtikLESS
## Описание задания:
Secure coding is the keystone of the application security!
## Ссылка на задание:
https://app.hackthebox.com/challenges/Cryptohorrific
# Решение:
Для решения этого задания необходимо скачать файл Cryptohorrific.zip, который содержит необходимый для исследования репозиторий для приложения IOS.

Команда для распаковки:
> unzip Cryptohorrific.zip

В самом начале первое на что надо обратить внимание, так это на то, что в репозитории приложения хранится два файла `.plist` (файла конфигурации Mach-O/IOS приложений).
Это довольно нестандартно, тем более один из файлов называется `challenge.plist`.

> Вот так выглядит репозиторий:
<img width="733" height="436" alt="папка" src="https://github.com/user-attachments/assets/b5899690-c513-429d-8a52-817c7c4ad45b" />

Анализ `.plist` файла в текущем формате абсолютно бесполезен, так как он представлен в бинарном виде. Однако есть различные утилиты, которые позволяют переформатировать файл в
читаемый для пользователя формат, например, XML.

На дистрибутиве Kali можно использовать следующую утилиту:
> sudo apt-get install libplist-utils

Далее само форматирование файла в удобный формат для чтения с использованием следующей команды.
> plistutil -i challenge.plist -o done.xml

<img width="1053" height="221" alt="image" src="https://github.com/user-attachments/assets/af4db10f-fa92-414d-84e7-1cdb9d8fe111" />

Эта странная строка `Tq+CWzQS0wYzs2rJ+GNrPLP6qekDbwze6fIeRRwBK2WXHOhba7WR2OGNUFKoAvyW7njTCMlQzlwIRdJvaP2iYQ==`, по-видимому, зашифрована. Для того, чтобы разобраться, как она зашифрована можно использовать утилиту strings и radare2. Для этого исследование проводить следует уже на бинарном файле, который пока даже не затрагивался в решении.

<img width="560" height="222" alt="Снимок экрана 2026-01-27 043623" src="https://github.com/user-attachments/assets/30a9976e-b65c-4acf-9881-0df8351ea546" />

При анализе с помощью strings был обнаружен класс ViewController (контроллер интерфейса) и один из его методов, который занимается шифрованием/расшифрованием, так как использует в своих аргументах переменную ключа и синхропосылки.

Используя утилиту radare2 уже можно найти интересные сведения о строках. 
- !A%D*G-KaPdSgVkY
- QfTjWnZq4t7w!z%C

В контексте того, что они хранятся в странном формате и рядом в памяти со строкой `challenge`, можно сделать предположение, что это и есть искомые ключ с синхропосылкой.

<img width="686" height="337" alt="image" src="https://github.com/user-attachments/assets/ce056b90-11f6-48a6-b961-b47b003af4f6" />

Далее были подобраны вероятные комбинации для режимов AES с найденными в процессе анализа данными. Словом, был проведён небольшой криптоанализ.
> Результат расшифрования:
<img width="1214" height="756" alt="image" src="https://github.com/user-attachments/assets/2d890682-35a7-4b23-95c9-1fef48d075ed" />

Флаг: HTB{%SoC00l_H4ckTh3b0xbyBs3cur31stCh4ll3ng3!!Cr4zY%}
