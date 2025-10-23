export const load_google_maps = (() => {
  let is_loaded = false;

  return () => {
    if (is_loaded) {
      return;
    }

    ((g: any) => {
      var h: any,
        a: any,
        k: any,
        p = "The Google Maps JavaScript API",
        c = "google",
        l = "importLibrary",
        q = "__ib__",
        m = document,
        b: any = window;
      b = b[c] || (b[c] = {});
      var d = b.maps || (b.maps = {}),
        r = new Set(),
        e = new URLSearchParams(),
        u = () =>
          h ||
          (h = new Promise(async (f, n) => {
            await (a = m.createElement("script"));
            e.set("libraries", [...r] + "");
            for (k in g)
              e.set(
                k.replace(/[A-Z]/g, (t: string) => "_" + t[0].toLowerCase()),
                g[k]
              );
            e.set("callback", c + ".maps." + q);
            a.src = `https://maps.${c}apis.com/maps/api/js?` + e;
            d[q] = f;
            a.onerror = () => (h = n(Error(p + " could not load.")));
            a.nonce = (m.querySelector("script[nonce]") as HTMLScriptElement)?.nonce || "";
            m.head.append(a);
          }));
      d[l] ? console.warn(p + " only loads once. Ignoring:", g) : (d[l] = (f: any, ...n: any[]) => r.add(f) && u().then(() => d[l](f, ...n)));
    })({
      key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
      v: "weekly",
    });

    is_loaded = true;
  };
})();
