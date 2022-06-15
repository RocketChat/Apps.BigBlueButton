# Apps.BigBlueButton

## 📙 About the App

An integration of Big Blue Button with Rocket.Chat for conducting a weekly meeting and maintaining the recording video archive. This Rocket.Chat App that will enable users in a channel to join an existing weekly meeting if it is in progress. Or query for recorded meeting videos and view them.

## 📝 What Apps.BigBlueButton does?

## 🚀 Steps to run

- Clone this Repository: 
    ```
    git clone https://github.com/RocketChat/Apps.BigBlueButton.git
    ```

- Change the Directory: 
    ```
    cd Apps.BigBlueButton
    ```

- Install the required dependencies: 
    ```
    npm install
    ```

- Make Sure you have Rocket.Chat server running on your localhost & you have  [Rocket.Chat.Apps-cli](https://github.com/RocketChat/Rocket.Chat.Apps-cli) installed, if not :
    ```
    npm install -g @rocket.chat/apps-cli
    ```

- Install the app:
    ```
    rc-apps deploy --url http://localhost:3000 --username user_username --password user_password
    ```
    Where:
    - `http://localhost:3000` is your local server URL (if you are running in another port, change the 3000 to the appropriate port)
    - `user_username` is the username of your admin user.
    - `user_password` is the password of your admin user.
    
    For more info refer [this](https://rocket.chat/docs/developer-guides/developing-apps/getting-started/) guide.

##  👨🏻‍💼 Documentation for reference

Here are some links to examples and documentation:
- [Rocket.Chat Apps TypeScript Definitions Documentation](https://rocketchat.github.io/Rocket.Chat.Apps-engine/)
- [Rocket.Chat Apps TypeScript Definitions Repository](https://github.com/RocketChat/Rocket.Chat.Apps-engine)
- [Example Rocket.Chat Apps](https://github.com/graywolf336/RocketChatApps)
- Community Forums
  - [App Requests](https://forums.rocket.chat/c/rocket-chat-apps/requests)
  - [App Guides](https://forums.rocket.chat/c/rocket-chat-apps/guides)
  - [Top View of Both Categories](https://forums.rocket.chat/c/rocket-chat-apps)
- [#rocketchat-apps on Open.Rocket.Chat](https://open.rocket.chat/channel/rocketchat-apps)