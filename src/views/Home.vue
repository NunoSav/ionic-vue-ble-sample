<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>Blank</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Blank</ion-title>
        </ion-toolbar>
      </ion-header>

      <ion-list>
        <ion-item
          v-for="$d in devices"
          :key="$d.address"
          @click="connect($d.address)"
        >
          <ion-label>
            {{ $d.name }}
          </ion-label>
        </ion-item>
      </ion-list>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  onIonViewWillEnter,
  IonList,
  IonItem,
  IonLabel,
} from "@ionic/vue";
import { defineComponent, toRefs } from "vue";
import {
  initialize,
  connect,
  read,
  write,
  bluetoothState,
  startScan,
} from "@/bluetooth";

export default defineComponent({
  name: "Home",
  components: {
    IonContent,
    IonHeader,
    IonPage,
    IonTitle,
    IonToolbar,
    IonList,
    IonItem,
    IonLabel,
  },

  async setup() {
    onIonViewWillEnter(async () => {
      await initialize();
      if (bluetoothState.enabled) startScan();
    });

    return {
      ...toRefs(bluetoothState),
      connect,
    };
  },
});
</script>

<style scoped>
#container {
  text-align: center;

  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
}

#container strong {
  font-size: 20px;
  line-height: 26px;
}

#container p {
  font-size: 16px;
  line-height: 22px;

  color: #8c8c8c;

  margin: 0;
}

#container a {
  text-decoration: none;
}
</style>