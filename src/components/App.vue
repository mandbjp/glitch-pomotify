<template>
  <div id="app">
    <header>
      Pomotify - #Pomodoro + #Spotify
    </header>
    <main>
      <div class="pomodoro" :class="pomoStatus">
        <h3>
          Pomodoro Timer
        </h3>
        Status: <strong>{{ pomoStatus }}</strong
        ><br />
        <input v-model="pomoSeconds" /><br />
        <div class="readable-pomo-timer">
          Cycle {{pomoCycleCount}} -
          <span class="minutes">{{readableMinutes}}</span>
          <span class="seconds">{{readableSeconds}}</span>
        </div>
        <button @click="togglePomo">Play/Pause</button>
      </div>
      <div class="spotify">
        <h3>
          Spotify Player
        </h3>
        <div>
          <h4>
            Token
          </h4>
          <input v-model="token" />
          <p>
            Collect your token
            <a
              href="https://developer.spotify.com/documentation/web-playback-sdk/quick-start/#"
               target="_blank"
              >here</a
            ><br />
            After changin token, reload this page.
          </p>
        </div>
        <div>
          <h4>
            Media Controller
          </h4>
          <input v-model="volume" />
          <button @click="doFadein">doFadein</button>
          <button @click="toggle">Play/Pause</button>
          <button @click="doFadeout">doFadeout</button>
        </div>
      </div>
    </main>
    <footer></footer>
  </div>
</template>

<script>
const POMO_WORK_SECONDS = 25 * 60;
const POMO_REST_SECONDS = 5 * 60;

const bell1x = new Audio(
  "https://cdn.glitch.com/2cce65c9-0125-4612-a8cd-4a3c629891ab%2FDesk%20bell%20hitting%20sharply.mp3?v=1608734351563"
);
const bell2x = new Audio(
  "https://cdn.glitch.com/2cce65c9-0125-4612-a8cd-4a3c629891ab%2FDesk%20bell%20hitting%20sharply%20x2.mp3?v=1608734351580"
);

export default {
  data() {
    return {
      token: "",
      player: null,
      volume: 100,
      pomoStatus: "work", // ['work' / 'rest']
      pomoSeconds: POMO_WORK_SECONDS,
      pomoHandler: null,
      pomoCycleCount: 1,
    };
  },
  computed: {
    readableMinutes() {
      return Math.floor(this.pomoSeconds / 60);
    },
    readableSeconds() {
      return this.pomoSeconds % 60;
    }
  },
  watch: {
    volume() {
      console.log("new volume", this.volume);
      this.player.setVolume(0.01 * this.volume);
    },
    token() {
      localStorage["token"] = this.token;
    }
  },
  methods: {
    loadSpotify() {
      window.onSpotifyWebPlaybackSDKReady = () => {
        const token = this.token;
        const player = (this.player = new Spotify.Player({
          name: "[GLITCH] Web Playback SDK Quick Start Player",
          getOAuthToken: cb => {
            cb(token);
          }
        }));

        // Error handling
        player.addListener("initialization_error", ({ message }) => {
          console.error(message);
        });
        player.addListener("authentication_error", ({ message }) => {
          console.error(message);
        });
        player.addListener("account_error", ({ message }) => {
          console.error(message);
        });
        player.addListener("playback_error", ({ message }) => {
          console.error(message);
        });

        // Playback status updates
        player.addListener("player_state_changed", state => {
          console.log(state);
        });

        // Ready
        player.addListener("ready", ({ device_id }) => {
          console.log("Ready with Device ID", device_id);
        });

        // Not Ready
        player.addListener("not_ready", ({ device_id }) => {
          console.log("Device ID has gone offline", device_id);
        });

        // Connect to the player!
        player.connect();
      };
    },
    onPlayStateChange(state) {
      console.log("state!", state);
    },
    toggle() {
      this.player.togglePlay();
    },
    async doFadein() {
      await this.player.resume();
      await this.fadein();
    },
    async doFadeout() {
      await this.fadeout();
      await this.player.pause();
    },
    fadein() {
      return new Promise(resolve => {
        let count = 10;
        let volume = 0;
        const handler = setInterval(() => {
          volume += 10;
          console.log("volume", volume, count, this.volume);
          this.player.setVolume(0.0001 * volume * this.volume);
          if (!--count) {
            clearInterval(handler);
            resolve();
          }
        }, 100);
      });
    },
    fadeout() {
      return new Promise(resolve => {
        let count = 10;
        let volume = 100;
        const handler = setInterval(() => {
          volume -= 10;
          console.log("volume", volume, count, this.volume);
          this.player.setVolume(0.0001 * volume * this.volume);
          if (!--count) {
            clearInterval(handler);
            resolve();
          }
        }, 100);
      });
    },
    async togglePomo() {
      if (this.pomoHandler) {
        // pause pomo
        this.player.pause();
        clearInterval(this.pomoHandler);
        this.pomoHandler = null;
        return;
      }
      // start pomo
      this.player.resume();
      this.pomoHandler = setInterval(() => {
        const isZero = --this.pomoSeconds === 0;
        const { pomoStatus, readableMinutes, readableSeconds} = this
        document.title = `[${pomoStatus}] ${readableMinutes}:${readableSeconds} - Pomotify`
        if (isZero) {
          if (this.pomoStatus === "work") {
            Promise.resolve()
              .then(this.fadeout)
              .then(() => bell1x.play());
            this.pomoSeconds = POMO_REST_SECONDS;
            this.pomoStatus = "rest";
            return;
          }
          bell2x.play().then(this.fadein);
          this.pomoSeconds = POMO_WORK_SECONDS;
          this.pomoStatus = "work";
          this.pomoCycleCount++;
        }
      }, 1000);
    }
  },
  mounted() {
    this.token = localStorage.getItem("token");
    this.loadSpotify();
  }
};
</script>

<style>
@import "../style/normalize.css";

body {
  margin: 0;
}

main {
  padding: 1rem;
}

header {
  padding: 1rem;
  background: whitesmoke;
}

button {
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  background: transparent;
}
.pomodoro,
.spotify {
  padding: 8px;
  border: 1px solid #eee;
  margin-bottom: 24px;
}
.pomodoro h3 {
  background-color: #ffecb3;
  padding: 1rem;
}
.spotify h3 {
  background-color: #c5e1a5;
  padding: 1rem;
}
  .pomodoro.rest {
    background-color: lightgray;
    color: gray;
  }
  .readable-pomo-timer .minutes,
  .readable-pomo-timer .seconds {
    font-size: 4rem;
  }
  .minutes:after,
  .seconds:after {
    font-size: 1rem;
    font-weight: bold;
  }
  .minutes:after{
    content: 'm';
  }
  .seconds:after {
    content: 's';
  }
</style>
