export interface ChangelogEntry {
    version: string;
    date: string;
    changes: string[];
}

export const changelogData: ChangelogEntry[] = [
    {
        version: "1.5.0",
        date: "2025-05-25",
        changes: [
            "VIKASIETOISUUS: Lisätty automaattinen 'Linnuntie'-tila. Jos reitityspalvelimet eivät vastaa, sovellus laskee matkan suorina viivoina, jotta käyttö voi jatkua.",
            "ULKOASU: Varmistettu Zoom-painikkeiden sijainti oikeassa alareunassa.",
            "ULKOASU: Varatilan reitti piirretään punaisella katkoviivalla erottuakseen tiereitistä."
        ]
    },
    {
        version: "1.4.4",
        date: "2025-05-25",
        changes: [
            "UX-PARANNUS: Siirretty kartan zoomaus-painikkeet oikeaan alareunaan paremman käytettävyyden vuoksi.",
            "TEKNINEN: Lisätty kolmas varapalvelin reititykselle vikasietoisuuden maksimoimiseksi.",
            "ULKOASU: Siirretty tekijätiedot ja muutosloki-painike vasempaan alareunaan."
        ]
    },
    {
        version: "1.4.3",
        date: "2025-05-24",
        changes: [
            "PARANNUS: Vaihdettu ensisijainen reitityspalvelin luotettavampaan eurooppalaiseen palveluun.",
            "LISÄYS: Käyttöliittymä näyttää nyt selkeän virheilmoituksen, jos reitityspalvelimet ovat ruuhkautuneet."
        ]
    },
    {
        version: "1.4.2",
        date: "2025-05-24",
        changes: [
            "HOTFIX: Lisätty automaattinen varapalvelin reititykselle. Jos ensisijainen palvelin ei vastaa, sovellus kokeilee automaattisesti vaihtoehtoista palvelua.",
            "Parannettu vikasietoisuutta 'Failed to fetch' -virhetilanteissa."
        ]
    },
    {
        version: "1.4.1",
        date: "2025-05-24",
        changes: [
            "KORJAUS: Palautettu reittilaskennan vakaus poistamalla kokeellinen U-käännös-asetus, joka esti reitin muodostumisen.",
            "Varmistettu reitin piirtyminen ja kopiointitoiminnon palautuminen."
        ]
    },
    {
        version: "1.4.0",
        date: "2025-05-24",
        changes: [
            "Viimeistelty käyttöliittymän ulkoasu vastaamaan yhtenäistä 'e-paper' -teemaa.",
            "Kustomoitu kartan zoom-painikkeet ja popup-ikkunat.",
            "Valmisteltu julkista jakelua varten (API-riippumattomuus varmistettu)."
        ]
    },
    {
        version: "1.3.2",
        date: "2025-05-23",
        changes: [
            "Korjattu reititys sallimaan U-käännökset välietapeissa. Tämä poistaa turhat kiertotiet erityisesti edestakaisilla matkoilla.",
            "Tarkennettu käyttöliittymässä, että reitti lasketaan autolle."
        ]
    },
    {
        version: "1.3.1",
        date: "2025-05-23",
        changes: [
            "Korjattu Tyhjennä-painikkeen toiminta: nyt kaksivaiheinen varmistus ilman selainikkunaa."
        ]
    },
    {
        version: "1.3.0",
        date: "2025-05-23",
        changes: [
            "Lisätty Tyhjennä-painike reittilistaan.",
            "Mahdollistettu reittipisteiden järjestäminen raahaamalla (Drag & Drop).",
            "Korjattu: Osoitteen nimi päivittyy nyt automaattisesti, kun nastaa siirretään kartalla."
        ]
    },
    {
        version: "1.2.0",
        date: "2025-05-22",
        changes: [
            "Lisätty mahdollisuus raahata karttanastoja sijainnin tarkentamiseksi.",
            "Lisätty ohjeistus nastojen siirtämiseen.",
            "Parannettu reitin uudelleenlaskentaa nastoja siirrettäessä."
        ]
    },
    {
        version: "1.1.0",
        date: "2025-05-22",
        changes: [
            "Lisätty mahdollisuus luoda omia pikavalintoja asetusten kautta.",
            "Poistettu kovakoodatut kohteet (Työ, Kuntosali).",
            "Lisätty muutosloki-ikkuna.",
            "Korjattu osoitteenmuodostus säilyttämään talonumerot luotettavammin.",
            "Parannettu leikepöydälle kopioinnin logiikkaa."
        ]
    },
    {
        version: "1.0.0",
        date: "2025-05-20",
        changes: [
            "Sovelluksen julkaisu.",
            "Reittihaku ja etappien hallinta.",
            "Automaattinen matkan ja ajan laskenta.",
            "Lapua-keskeinen karttanäkymä."
        ]
    }
];