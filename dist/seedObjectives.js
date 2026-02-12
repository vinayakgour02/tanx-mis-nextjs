"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@prisma/client");
var faker_1 = require("@faker-js/faker");
var prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var organizationId, org, levels, total, i, scopeType, programId, projectId, objectiveCount, code, level;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    organizationId = process.argv[2];
                    if (!organizationId) {
                        console.error('❌ Please provide an organizationId');
                        process.exit(1);
                    }
                    return [4 /*yield*/, prisma.organization.findUnique({
                            where: { id: organizationId },
                            include: { programs: true, projects: true },
                        })];
                case 1:
                    org = _a.sent();
                    if (!org) {
                        console.error('❌ Organization not found');
                        process.exit(1);
                    }
                    console.log("Seeding objectives for org: ".concat(org.name));
                    levels = ['Impact', 'Outcome', 'Output', 'Activity'];
                    total = 50;
                    i = 0;
                    _a.label = 2;
                case 2:
                    if (!(i < total)) return [3 /*break*/, 6];
                    scopeType = faker_1.faker.helpers.arrayElement(['organization', 'program', 'project']);
                    programId = null;
                    projectId = null;
                    if (scopeType === 'program' && org.programs.length > 0) {
                        programId = faker_1.faker.helpers.arrayElement(org.programs).id;
                    }
                    else if (scopeType === 'project' && org.projects.length > 0) {
                        projectId = faker_1.faker.helpers.arrayElement(org.projects).id;
                    }
                    return [4 /*yield*/, prisma.objective.count({
                            where: { organizationId: organizationId },
                        })];
                case 3:
                    objectiveCount = _a.sent();
                    code = "".concat('ORG', "-OBJ-").concat((objectiveCount + 1)
                        .toString()
                        .padStart(3, '0'));
                    level = faker_1.faker.helpers.arrayElement(levels);
                    return [4 /*yield*/, prisma.objective.create({
                            data: {
                                organizationId: organizationId,
                                programId: programId,
                                projectId: projectId,
                                code: code,
                                level: level,
                                description: faker_1.faker.company.catchPhrase(),
                                orderIndex: objectiveCount + 1,
                            },
                        })];
                case 4:
                    _a.sent();
                    _a.label = 5;
                case 5:
                    i++;
                    return [3 /*break*/, 2];
                case 6:
                    console.log("\u2705 Seeded ".concat(total, " objectives for org ").concat(org.name));
                    return [2 /*return*/];
            }
        });
    });
}
main()
    .then(function () { return prisma.$disconnect(); })
    .catch(function (e) {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
});
