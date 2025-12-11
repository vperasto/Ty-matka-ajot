export interface ChangelogEntry {
    version: string;
    date: string;
    changes: string[];
}

export const changelogData: ChangelogEntry[] = [
    {
        version: "1.0.0",
        date: "2024-05-23",
        changes: [
            "Sovelluksen julkaisuversio (Initial Release).",
            "REITITYS: Integroitu OpenRouteService (ORS) API tarkkaa ja luotettavaa reittilaskentaa varten.",
            "KÄYTTÖLIITTYMÄ: Selkeä 'E-paper / Brutalist' -teema ilman turhia kikkailuja.",
            "TOIMINNOT: Osoitehaku (Nominatim), Drag & Drop -pisteiden järjestely, automaattinen matkan ja keston laskenta.",
            "ALUE: Optimoitu erityisesti Lapuan ja lähialueiden työmatka-ajoihin."
        ]
    }
];