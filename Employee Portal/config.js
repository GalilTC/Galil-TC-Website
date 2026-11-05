/* =====================================================================
   GALIL Employee Portal — deployment settings (the same for everyone).

   One file for the whole portal: WorkDesk, Taskana and HR read their
   settings from here (WORKDESK_CONFIG, TASKANA_CONFIG and HR_CONFIG below
   are built from it).

   storage   where the shared data lives:
     "local"     this browser only — the standalone demo
     "github"    data files in a GitHub repository (the testing setup);
                 each device pastes one GitHub access token, once
     "onedrive"  the company OneDrive (needs entra.clientId)
   entra     fill in clientId and sign-in goes through Microsoft Entra ID;
             leave it empty for email + demo password (GalilWorkdesk1).

   Setting it up: the administrator section of install/index.html.
   ===================================================================== */
var PORTAL_CONFIG = {
  domain: "@galiltc.co.il",

  /* Pilot: only these people can sign in to the portal (WorkDesk, Taskana,
     the Handbook, the Knowledge Base, Model Studio, HR, Defense News).
     Everyone else sees "The portal is in a closed pilot". Empty the list
     to open the portal to everyone at the domain. */
  pilot: [
    "tamir@galiltc.co.il",          // Tamir Nisman — CEO
    "inon.kanner@galiltc.co.il",    // Inon Kanner — COO & Head of Business Division
    "danny.gelman@galiltc.co.il",   // Danny Gelman — Project Manager
    "daniel.barak@galiltc.co.il"    // Daniel Barak — Junior Technical Writer
  ],

  /* false: a new data file starts with only the pilot people above (or the
     whole GALIL team when the pilot list is empty), with no demo work, demo
     tasks or demo HR posts, and the "demo data" buttons are hidden. */
  demoData: false,

  storage: "github",

  /* the data lives in a PRIVATE repository, apart from the public website */
  github: {
    owner: "GalilTC",
    repo: "Galil-TC-Data"
  },

  entra: {
    clientId: "",                 // Application (client) ID — one app registration for the whole portal
    tenantId: ""                  // Directory (tenant) ID of galiltc.co.il
  },

  workdesk: {
    branch: "workdesk-data",      // GitHub: created on first use; every save is a commit on this branch
    path: "workdesk",             // GitHub: folder for workdesk-data.json
    folderLink: "",               // OneDrive: sharing link to the WorkDesk folder ("People in GALIL", Can edit)
    folderName: "WorkDesk",
    fileName: "workdesk-data.json"
  },

  taskana: {
    branch: "taskana-data",
    path: "taskana",
    folderLink: "",               // OneDrive: sharing link to the Taskana folder
    folderName: "Taskana",
    fileName: "taskana-data.json"
  },

  hr: {
    branch: "hr-data",
    path: "hr",
    folderLink: "",               // OneDrive: sharing link to the HR folder
    folderName: "HR",
    fileName: "hr-data.json"
  }
};

/* ---- what each app reads (no need to edit below this line) ---- */
var PORTAL_DEMO = PORTAL_CONFIG.demoData !== false;
var PORTAL_PILOT = (PORTAL_CONFIG.pilot || []).map(function (e) { return String(e).trim().toLowerCase(); });
var WORKDESK_CONFIG = {
  domain: PORTAL_CONFIG.domain,
  storage: PORTAL_CONFIG.storage,
  github: { owner: PORTAL_CONFIG.github.owner, repo: PORTAL_CONFIG.github.repo, branch: PORTAL_CONFIG.workdesk.branch, path: PORTAL_CONFIG.workdesk.path },
  entra: { clientId: PORTAL_CONFIG.entra.clientId, tenantId: PORTAL_CONFIG.entra.tenantId },
  onedrive: { folderLink: PORTAL_CONFIG.workdesk.folderLink, folderName: PORTAL_CONFIG.workdesk.folderName, fileName: PORTAL_CONFIG.workdesk.fileName }
};
var TASKANA_CONFIG = {
  domain: PORTAL_CONFIG.domain,
  storage: PORTAL_CONFIG.storage,
  github: { owner: PORTAL_CONFIG.github.owner, repo: PORTAL_CONFIG.github.repo, branch: PORTAL_CONFIG.taskana.branch, path: PORTAL_CONFIG.taskana.path },
  entra: { clientId: PORTAL_CONFIG.entra.clientId, tenantId: PORTAL_CONFIG.entra.tenantId },
  onedrive: { folderLink: PORTAL_CONFIG.taskana.folderLink, folderName: PORTAL_CONFIG.taskana.folderName, fileName: PORTAL_CONFIG.taskana.fileName }
};
var HR_CONFIG = {
  domain: PORTAL_CONFIG.domain,
  storage: PORTAL_CONFIG.storage,
  github: { owner: PORTAL_CONFIG.github.owner, repo: PORTAL_CONFIG.github.repo, branch: PORTAL_CONFIG.hr.branch, path: PORTAL_CONFIG.hr.path },
  entra: { clientId: PORTAL_CONFIG.entra.clientId, tenantId: PORTAL_CONFIG.entra.tenantId },
  onedrive: { folderLink: PORTAL_CONFIG.hr.folderLink, folderName: PORTAL_CONFIG.hr.folderName, fileName: PORTAL_CONFIG.hr.fileName }
};
