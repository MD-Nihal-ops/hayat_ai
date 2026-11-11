const fs = require("node:fs");
const path = require("node:path");
const sqlite3 = require("sqlite3").verbose();

const dataDirectory = path.join(__dirname, "data");
fs.mkdirSync(dataDirectory, { recursive: true });

const database = new sqlite3.Database(path.join(dataDirectory, "hayat.db"));

const ready = new Promise((resolve, reject) => {
  database.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    language TEXT
  );

  CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER,
    type TEXT NOT NULL,
    originalFileUrl TEXT NOT NULL,
    extractedValues TEXT NOT NULL,
    status TEXT NOT NULL,
    explanations TEXT NOT NULL DEFAULT '{}',
    documentDetails TEXT NOT NULL DEFAULT '{}',
    createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS healthMetrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    metricKey TEXT NOT NULL,
    label TEXT NOT NULL,
    value REAL NOT NULL,
    value2 REAL,
    unit TEXT,
    recordedAt TEXT NOT NULL,
    source TEXT NOT NULL CHECK (source IN ('report', 'self')),
    reportId INTEGER,
    rangeMin REAL,
    rangeMax REAL,
    createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS healthMetrics_user_metric_date
    ON healthMetrics (userId, metricKey, recordedAt, id);

  CREATE TABLE IF NOT EXISTS profiles (
    userId INTEGER NOT NULL UNIQUE,
    fullName TEXT NOT NULL DEFAULT '',
    dateOfBirth TEXT NOT NULL DEFAULT '',
    bloodType TEXT NOT NULL DEFAULT '',
    allergies TEXT NOT NULL DEFAULT '[]',
    emergencyContactName TEXT NOT NULL DEFAULT '',
    emergencyContactPhone TEXT NOT NULL DEFAULT '',
    easyRead INTEGER NOT NULL DEFAULT 0 CHECK (easyRead IN (0, 1)),
    accessNeeds TEXT NOT NULL DEFAULT '{"needs":[],"note":"","includeOnCareCard":false}',
    updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS familyMembers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ownerId INTEGER NOT NULL,
    memberName TEXT NOT NULL,
    memberEmail TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('caregiver', 'emergency_contact_only')),
    permissions TEXT NOT NULL DEFAULT '{"canViewMedicines":false,"canViewAppointments":false,"canClaimTasks":false,"canViewAccessNeeds":false}',
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
    createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    consentAcknowledgedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    consentVersion TEXT NOT NULL DEFAULT 'f1-v1',
    revokedAt TEXT
  );
  CREATE INDEX IF NOT EXISTS familyMembers_owner_status
    ON familyMembers (ownerId, status, id);
  CREATE INDEX IF NOT EXISTS familyMembers_email_status
    ON familyMembers (memberEmail, status, id);
  CREATE UNIQUE INDEX IF NOT EXISTS familyMembers_active_owner_email
    ON familyMembers (ownerId, lower(memberEmail)) WHERE status = 'active';

  CREATE TABLE IF NOT EXISTS reminders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    medicineName TEXT NOT NULL,
    time TEXT NOT NULL,
    days TEXT NOT NULL DEFAULT '0,1,2,3,4,5,6'
  );

  CREATE TABLE IF NOT EXISTS doseLog (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    medicineName TEXT NOT NULL,
    doseTime TEXT NOT NULL,
    date TEXT NOT NULL,
    taken INTEGER NOT NULL
  );

  CREATE UNIQUE INDEX IF NOT EXISTS doseLog_user_dose_date
    ON doseLog (userId, medicineName, doseTime, date);

  CREATE TABLE IF NOT EXISTS wellnessGoals (
    userId INTEGER PRIMARY KEY,
    stepsTarget INTEGER NOT NULL DEFAULT 0 CHECK (stepsTarget BETWEEN 0 AND 150000),
    activityMinutesTarget INTEGER NOT NULL DEFAULT 0 CHECK (activityMinutesTarget BETWEEN 0 AND 1440),
    waterGlassesTarget INTEGER NOT NULL DEFAULT 0 CHECK (waterGlassesTarget BETWEEN 0 AND 100),
    sleepHoursTarget REAL NOT NULL DEFAULT 0 CHECK (sleepHoursTarget BETWEEN 0 AND 24),
    habitText TEXT NOT NULL DEFAULT '' CHECK (length(habitText) <= 60),
    updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS wellnessLogs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    date TEXT NOT NULL,
    steps INTEGER CHECK (steps IS NULL OR steps BETWEEN 0 AND 150000),
    activityMinutes INTEGER CHECK (activityMinutes IS NULL OR activityMinutes BETWEEN 0 AND 1440),
    waterGlasses INTEGER CHECK (waterGlasses IS NULL OR waterGlasses BETWEEN 0 AND 100),
    sleepHours REAL CHECK (sleepHours IS NULL OR sleepHours BETWEEN 0 AND 24),
    habitDone INTEGER NOT NULL DEFAULT 0 CHECK (habitDone IN (0, 1)),
    createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (userId, date)
  );
  CREATE INDEX IF NOT EXISTS wellnessLogs_user_date ON wellnessLogs (userId, date);

  CREATE TABLE IF NOT EXISTS preventionReminders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    kind TEXT NOT NULL CHECK (kind IN ('checkup', 'vaccination')),
    title TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 100),
    remindOn TEXT NOT NULL,
    done INTEGER NOT NULL DEFAULT 0 CHECK (done IN (0, 1)),
    doneAt TEXT,
    createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS preventionReminders_user_date ON preventionReminders (userId, remindOn, id);

  CREATE TABLE IF NOT EXISTS wellnessChallenges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ownerId INTEGER NOT NULL,
    challengeKey TEXT NOT NULL,
    name TEXT NOT NULL,
    startDate TEXT NOT NULL,
    endDate TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended')),
    createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS wellnessChallenges_owner_date ON wellnessChallenges (ownerId, createdAt, id);

  CREATE TABLE IF NOT EXISTS wellnessChallengeMembers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    challengeId INTEGER NOT NULL,
    familyMemberId INTEGER,
    userId INTEGER,
    memberEmail TEXT NOT NULL,
    memberName TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'joined', 'declined', 'left')),
    shareTotals INTEGER NOT NULL DEFAULT 0 CHECK (shareTotals IN (0, 1)),
    shareHabit INTEGER NOT NULL DEFAULT 0 CHECK (shareHabit IN (0, 1)),
    createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    joinedAt TEXT,
    leftAt TEXT
  );
  CREATE UNIQUE INDEX IF NOT EXISTS wellnessChallengeMembers_challenge_email
    ON wellnessChallengeMembers (challengeId, lower(memberEmail));
  CREATE INDEX IF NOT EXISTS wellnessChallengeMembers_user_status
    ON wellnessChallengeMembers (userId, status, challengeId);

  CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    title TEXT NOT NULL,
    dateTime TEXT NOT NULL,
    place TEXT NOT NULL DEFAULT '',
    notes TEXT NOT NULL DEFAULT '',
    sourceReportId INTEGER
  );

  CREATE TABLE IF NOT EXISTS insurancePolicies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    fileName TEXT DEFAULT '',
    filePath TEXT DEFAULT '',
    mimeType TEXT DEFAULT '',
    insurerName TEXT DEFAULT '',
    planName TEXT DEFAULT '',
    policyholderName TEXT DEFAULT '',
    organizationName TEXT DEFAULT '',
    policyNumber TEXT DEFAULT '',
    memberId TEXT DEFAULT '',
    startDate TEXT DEFAULT '',
    endDate TEXT DEFAULT '',
    insurerPhone TEXT DEFAULT '',
    coveragePercent REAL,
    deductible REAL,
    copay REAL,
    createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS geocodeCache (
    key TEXT PRIMARY KEY,
    address TEXT NOT NULL,
    fetchedAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS chatMessages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL DEFAULT '',
    language TEXT NOT NULL,
    kind TEXT NOT NULL,
    category TEXT,
    conversationId INTEGER,
    messageType TEXT NOT NULL DEFAULT 'text' CHECK (messageType IN ('text', 'attachment', 'review', 'explanation')),
    payload TEXT NOT NULL DEFAULT '{}',
    reportIds TEXT NOT NULL DEFAULT '[]',
    createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    title TEXT NOT NULL DEFAULT 'New chat',
    createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS shares (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ownerId INTEGER NOT NULL,
    sharedWithEmail TEXT NOT NULL,
    reportId INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
    includeOriginal INTEGER NOT NULL DEFAULT 0,
    consentId TEXT,
    createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expiresAt TEXT,
    revokedAt TEXT
  );

  CREATE TABLE IF NOT EXISTS sharedQuestions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ownerId INTEGER NOT NULL,
    reportId INTEGER NOT NULL,
    authorId INTEGER NOT NULL,
    authorEmail TEXT NOT NULL,
    authorName TEXT NOT NULL,
    text TEXT NOT NULL,
    resolved INTEGER NOT NULL DEFAULT 0 CHECK (resolved IN (0, 1)),
    createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    shareId INTEGER
  );
  CREATE INDEX IF NOT EXISTS sharedQuestions_report_date
    ON sharedQuestions (ownerId, reportId, createdAt, id);
  CREATE INDEX IF NOT EXISTS sharedQuestions_author
    ON sharedQuestions (authorId, reportId, id);
  CREATE INDEX IF NOT EXISTS sharedQuestions_share
    ON sharedQuestions (shareId) WHERE shareId IS NOT NULL;

  CREATE TABLE IF NOT EXISTS sharedTranslationGenerations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    viewerId INTEGER NOT NULL,
    shareId INTEGER NOT NULL,
    language TEXT NOT NULL CHECK (language IN ('en', 'ar', 'hi', 'ml')),
    createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS sharedTranslationGenerations_viewer_date
    ON sharedTranslationGenerations (viewerId, createdAt);

  CREATE TABLE IF NOT EXISTS consents (
    consentId TEXT PRIMARY KEY,
    userId INTEGER NOT NULL,
    dataCategories TEXT NOT NULL,
    resourceId INTEGER,
    recipientType TEXT NOT NULL CHECK (recipientType IN ('person', 'entity')),
    recipient TEXT NOT NULL,
    purpose TEXT NOT NULL,
    optional INTEGER NOT NULL DEFAULT 1 CHECK (optional IN (0, 1)),
    grantedAt TEXT,
    expiresAt TEXT,
    status TEXT NOT NULL CHECK (status IN ('granted', 'denied', 'revoked', 'expired')),
    revokedAt TEXT,
    consentVersion TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS consents_user_date
    ON consents (userId, grantedAt, consentId);

  CREATE TABLE IF NOT EXISTS consentEvents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    consentId TEXT NOT NULL,
    userId INTEGER NOT NULL,
    eventType TEXT NOT NULL CHECK (eventType IN ('grant', 'denial', 'revocation', 'expiry')),
    timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    consentVersion TEXT NOT NULL,
    details TEXT NOT NULL DEFAULT ''
  );
  CREATE INDEX IF NOT EXISTS consentEvents_user_date
    ON consentEvents (userId, timestamp, id);

  CREATE TABLE IF NOT EXISTS accessLog (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    action TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    ownerId INTEGER,
    viewerId INTEGER,
    viewerEmail TEXT,
    reportId INTEGER,
    details TEXT
  );

  CREATE TABLE IF NOT EXISTS familyJourneys (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    eventKey TEXT NOT NULL,
    affectedMembers TEXT NOT NULL DEFAULT '[]',
    createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS familyJourneys_user_updated
    ON familyJourneys (userId, updatedAt, id);

  CREATE TABLE IF NOT EXISTS familyJourneySteps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    journeyId INTEGER NOT NULL,
    userId INTEGER NOT NULL,
    stepKey TEXT NOT NULL,
    position INTEGER NOT NULL,
    details TEXT NOT NULL,
    completed INTEGER NOT NULL DEFAULT 0 CHECK (completed IN (0, 1)),
    progressStatus TEXT NOT NULL DEFAULT 'not_started' CHECK (progressStatus IN ('not_started', 'in_progress', 'completed')),
    createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (journeyId, stepKey)
  );
  CREATE INDEX IF NOT EXISTS familyJourneySteps_user_journey_position
    ON familyJourneySteps (userId, journeyId, position, id);

  CREATE TABLE IF NOT EXISTS careTasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ownerId INTEGER NOT NULL,
    reportId INTEGER,
    sourceKey TEXT,
    title TEXT NOT NULL,
    dueDate TEXT,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'claimed', 'done')),
    claimedById INTEGER,
    claimedByEmail TEXT,
    claimedAt TEXT,
    doneAt TEXT,
    createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE UNIQUE INDEX IF NOT EXISTS careTasks_owner_source
    ON careTasks (ownerId, sourceKey) WHERE sourceKey IS NOT NULL;
  CREATE INDEX IF NOT EXISTS careTasks_owner_status_due
    ON careTasks (ownerId, status, dueDate, id);

  CREATE TABLE IF NOT EXISTS referralSteps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    reportId INTEGER NOT NULL,
    text TEXT NOT NULL,
    documents TEXT NOT NULL DEFAULT '[]',
    done INTEGER NOT NULL DEFAULT 0,
    doneAt TEXT,
    sortOrder INTEGER NOT NULL DEFAULT 0
  );
  CREATE INDEX IF NOT EXISTS referralSteps_user_report_sort
    ON referralSteps (userId, reportId, sortOrder, id);
`, (error) => {
    if (error) {
      reject(error);
      return;
    }
    try {
      database.all("PRAGMA table_info(reports)", (columnsError, columns) => {
        if (columnsError) {
          reject(columnsError);
          return;
        }

        const existingColumns = new Set(columns.map((column) => column.name));
        const createdAtColumn = columns.find((column) => column.name === "createdAt");
        const addExplanations = existingColumns.has("explanations")
          ? Promise.resolve()
          : new Promise((resolveMigration, rejectMigration) => {
            database.run(
              "ALTER TABLE reports ADD COLUMN explanations TEXT NOT NULL DEFAULT '{}'",
              (migrationError) => migrationError ? rejectMigration(migrationError) : resolveMigration()
            );
          });
        const addDocumentDetails = existingColumns.has("documentDetails")
          ? Promise.resolve()
          : new Promise((resolveMigration, rejectMigration) => {
            database.run(
              "ALTER TABLE reports ADD COLUMN documentDetails TEXT NOT NULL DEFAULT '{}'",
              (migrationError) => migrationError ? rejectMigration(migrationError) : resolveMigration()
            );
          });

        const finishReady = () => {
          const migrateChatColumns = () => {
            database.all("PRAGMA table_info(chatMessages)", (chatColumnsError, chatColumns) => {
              if (chatColumnsError) {
                reject(chatColumnsError);
                return;
              }
              const existingChatColumns = new Set(chatColumns.map((column) => column.name));
              const migrations = [
                ["category", "ALTER TABLE chatMessages ADD COLUMN category TEXT"],
                ["conversationId", "ALTER TABLE chatMessages ADD COLUMN conversationId INTEGER"],
                ["messageType", "ALTER TABLE chatMessages ADD COLUMN messageType TEXT NOT NULL DEFAULT 'text' CHECK (messageType IN ('text', 'attachment', 'review', 'explanation'))"],
                ["payload", "ALTER TABLE chatMessages ADD COLUMN payload TEXT NOT NULL DEFAULT '{}'"]
              ];
              const migrateSharesAndAccessLog = () => {
                const migrateTable = (tableName, migrations, done) => {
                  database.all(`PRAGMA table_info(${tableName})`, (tableError, tableColumns) => {
                    if (tableError) {
                      reject(tableError);
                      return;
                    }
                    const columns = new Set(tableColumns.map((column) => column.name));
                    const addColumn = (index) => {
                      if (index >= migrations.length) {
                        done();
                        return;
                      }
                      const [columnName, sql] = migrations[index];
                      if (columns.has(columnName)) {
                        addColumn(index + 1);
                        return;
                      }
                      database.run(sql, (migrationError) => {
                        if (migrationError) {
                          reject(migrationError);
                          return;
                        }
                        addColumn(index + 1);
                      });
                    };
                    addColumn(0);
                  });
                };

                migrateTable("shares", [
                  ["status", "ALTER TABLE shares ADD COLUMN status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked'))"],
                  ["includeOriginal", "ALTER TABLE shares ADD COLUMN includeOriginal INTEGER NOT NULL DEFAULT 0"],
                  ["consentId", "ALTER TABLE shares ADD COLUMN consentId TEXT"],
                  ["createdAt", "ALTER TABLE shares ADD COLUMN createdAt TEXT"],
                  ["expiresAt", "ALTER TABLE shares ADD COLUMN expiresAt TEXT"],
                  ["revokedAt", "ALTER TABLE shares ADD COLUMN revokedAt TEXT"]
                ], () => {
                  database.run("UPDATE shares SET createdAt = CURRENT_TIMESTAMP WHERE createdAt IS NULL", (backfillError) => {
                    if (backfillError) {
                      reject(backfillError);
                      return;
                    }
                    migrateTable("accessLog", [
                          ["ownerId", "ALTER TABLE accessLog ADD COLUMN ownerId INTEGER"],
                          ["viewerId", "ALTER TABLE accessLog ADD COLUMN viewerId INTEGER"],
                          ["viewerEmail", "ALTER TABLE accessLog ADD COLUMN viewerEmail TEXT"],
                          ["reportId", "ALTER TABLE accessLog ADD COLUMN reportId INTEGER"],
                          ["details", "ALTER TABLE accessLog ADD COLUMN details TEXT"]
                    ], () => {
                      const revokeLegacyShares = () => {
                        database.all(
                          "SELECT id, ownerId, sharedWithEmail, reportId FROM shares WHERE consentId IS NULL AND status = 'active'",
                          (sharesError, legacyShares) => {
                            if (sharesError) {
                              reject(sharesError);
                              return;
                            }
                            const revokeNext = (index) => {
                              if (index >= legacyShares.length) {
                                finishMigrations();
                                return;
                              }
                              const share = legacyShares[index];
                              database.run(
                                "UPDATE shares SET status = 'revoked', revokedAt = CURRENT_TIMESTAMP WHERE id = ? AND status = 'active'",
                                [share.id],
                                function (updateError) {
                                  if (updateError) {
                                    reject(updateError);
                                    return;
                                  }
                                  if (!this.changes) {
                                    revokeNext(index + 1);
                                    return;
                                  }
                                  database.run(
                                    `INSERT INTO accessLog
                                       (userId, ownerId, viewerEmail, reportId, action, details, timestamp)
                                     VALUES (?, ?, ?, ?, 'share_revoked', 'Sharing stopped because no active consent record existed', CURRENT_TIMESTAMP)`,
                                    [share.ownerId, share.ownerId, share.sharedWithEmail, share.reportId],
                                    (logError) => logError ? reject(logError) : revokeNext(index + 1)
                                  );
                                }
                              );
                            };
                            revokeNext(0);
                          }
                        );
                      };
                      const finishMigrations = () => {
                          migrateTable("profiles", [
                            ["easyRead", "ALTER TABLE profiles ADD COLUMN easyRead INTEGER NOT NULL DEFAULT 0 CHECK (easyRead IN (0, 1))"],
                            ["accessNeeds", "ALTER TABLE profiles ADD COLUMN accessNeeds TEXT NOT NULL DEFAULT '{\"needs\":[],\"note\":\"\",\"includeOnCareCard\":false}'"]
                          ], () => {
                          migrateTable("consents", [
                            ["resourceId", "ALTER TABLE consents ADD COLUMN resourceId INTEGER"]
                          ], () => {
                            migrateTable("familyJourneySteps", [
                              ["progressStatus", "ALTER TABLE familyJourneySteps ADD COLUMN progressStatus TEXT NOT NULL DEFAULT 'not_started' CHECK (progressStatus IN ('not_started', 'in_progress', 'completed'))"]
                            ], () => {
                              database.run(
                                `UPDATE familyJourneySteps SET progressStatus = 'completed'
                                 WHERE completed = 1 AND progressStatus = 'not_started'`,
                                (progressError) => {
                                  if (progressError) {
                                    reject(progressError);
                                    return;
                                  }
                                  database.run(
                                    `CREATE UNIQUE INDEX IF NOT EXISTS shares_active_owner_email_report
                                     ON shares (ownerId, sharedWithEmail, reportId) WHERE status = 'active'`,
                                    (indexError) => indexError ? reject(indexError) : resolve()
                                  );
                                }
                              );
                            });
                          });
                          });
                      };
                      revokeLegacyShares();
                    });
                  });
                });
              };

              const migrateLegacyMessages = () => {
                database.all(
                  `SELECT userId, MIN(id) AS firstId, MAX(createdAt) AS updatedAt
                   FROM chatMessages WHERE conversationId IS NULL
                   GROUP BY userId ORDER BY firstId`,
                  (legacyError, legacyUsers) => {
                    if (legacyError) {
                      reject(legacyError);
                      return;
                    }
                    const migrateUser = (index) => {
                      if (index >= legacyUsers.length) {
                          migrateSharesAndAccessLog();
                        return;
                      }
                      const user = legacyUsers[index];
                      database.get(
                        "SELECT createdAt FROM chatMessages WHERE userId = ? AND conversationId IS NULL ORDER BY id LIMIT 1",
                        [user.userId],
                        (firstMessageError, firstMessage) => {
                          if (firstMessageError) {
                            reject(firstMessageError);
                            return;
                          }
                          database.run(
                            `INSERT INTO conversations (userId, title, createdAt, updatedAt)
                             VALUES (?, 'Earlier chat', ?, ?)`,
                            [user.userId, firstMessage?.createdAt || user.updatedAt, user.updatedAt],
                            function (insertError) {
                              if (insertError) {
                                reject(insertError);
                                return;
                              }
                              database.run(
                                "UPDATE chatMessages SET conversationId = ? WHERE userId = ? AND conversationId IS NULL",
                                [this.lastID, user.userId],
                                (updateError) => updateError ? reject(updateError) : migrateUser(index + 1)
                              );
                            }
                          );
                        }
                      );
                    };
                    migrateUser(0);
                  }
                );
              };
              const addMissingColumn = (index) => {
                if (index >= migrations.length) {
                  migrateLegacyMessages();
                  return;
                }
                const [columnName, sql] = migrations[index];
                if (existingChatColumns.has(columnName)) {
                  addMissingColumn(index + 1);
                  return;
                }
                database.run(sql, (migrationError) => {
                  if (migrationError) {
                    reject(migrationError);
                    return;
                  }
                  addMissingColumn(index + 1);
                });
              };
              addMissingColumn(0);
            });
          };

          database.all("PRAGMA table_info(reminders)", (reminderColumnsError, reminderColumns) => {
            if (reminderColumnsError) {
              reject(reminderColumnsError);
              return;
            }
            if (reminderColumns.some((column) => column.name === "days")) {
              migrateChatColumns();
              return;
            }
            database.run(
              "ALTER TABLE reminders ADD COLUMN days TEXT NOT NULL DEFAULT '0,1,2,3,4,5,6'",
              (migrationError) => migrationError ? reject(migrationError) : migrateChatColumns()
            );
          });
        };

        Promise.all([addExplanations, addDocumentDetails]).then(() => {
          if (createdAtColumn?.dflt_value === "CURRENT_TIMESTAMP") {
            database.run(
              "UPDATE reports SET createdAt = CURRENT_TIMESTAMP WHERE createdAt IS NULL",
              (backfillError) => backfillError ? reject(backfillError) : finishReady()
            );
            return;
          }

          const createdAtValue = existingColumns.has("createdAt")
            ? "COALESCE(createdAt, CURRENT_TIMESTAMP)"
            : "CURRENT_TIMESTAMP";
          database.exec(`
            BEGIN IMMEDIATE;
            CREATE TABLE reports_replacement (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              userId INTEGER,
              type TEXT NOT NULL,
              originalFileUrl TEXT NOT NULL,
              extractedValues TEXT NOT NULL,
              status TEXT NOT NULL,
              explanations TEXT NOT NULL DEFAULT '{}',
              documentDetails TEXT NOT NULL DEFAULT '{}',
              createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
            INSERT INTO reports_replacement
              (id, userId, type, originalFileUrl, extractedValues, status, explanations, documentDetails, createdAt)
            SELECT id, userId, type, originalFileUrl, extractedValues, status,
              COALESCE(explanations, '{}'), COALESCE(documentDetails, '{}'), ${createdAtValue}
            FROM reports;
            DROP TABLE reports;
            ALTER TABLE reports_replacement RENAME TO reports;
            COMMIT;
          `, (migrationError) => migrationError ? reject(migrationError) : finishReady());
        }).catch(reject);
      });
    } catch (migrationError) {
      reject(migrationError);
    }
  });
});

function run(sql, ...params) {
  return ready.then(() => new Promise((resolve, reject) => {
    database.run(sql, params, function (error) {
      if (error) {
        reject(error);
        return;
      }
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  }));
}

function get(sql, ...params) {
  return ready.then(() => new Promise((resolve, reject) => {
    database.get(sql, params, (error, row) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(row);
    });
  }));
}

function all(sql, ...params) {
  return ready.then(() => new Promise((resolve, reject) => {
    database.all(sql, params, (error, rows) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(rows);
    });
  }));
}

module.exports = { ready, run, get, all };
