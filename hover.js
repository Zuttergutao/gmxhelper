const vscode = require('vscode');
const path = require('path');

module.exports = vscode.languages.registerHoverProvider('fasta', {
    provideHover(document, position, token) {
        const word = document.getText(document.getWordRangeAtPosition(position));
        if (word[position.character] == "H") {
            //return {
            //    contents: ["His(abbr. H)", "Histidine", "Positively charged", "pKa = 6.0"]
            //};
            x = position.line
            y = position.character
            return new vscode.Hover({
                language: "hover",
                value: "His(abbr. H)\nHistidine\nPositively charged\npKa = 6.0"
            }, new vscode.Range(new vscode.Position(x, y), new vscode.Position(x, y + 1)));
        } else if (word[position.character] == "R") {
            x = position.line
            y = position.character
            return new vscode.Hover({
                language: "hover",
                value: "Arg(abbr. R)\nArginine\nPositively charged\npKa = 12.1"
            }, new vscode.Range(new vscode.Position(x, y), new vscode.Position(x, y + 1)));
        } else if (word[position.character] == "K") {
            x = position.line
            y = position.character
            return new vscode.Hover({
                language: "hover",
                value: "Lys(abbr. K)\nLysine\nPositively charged\npKa = 10.7"
            }, new vscode.Range(new vscode.Position(x, y), new vscode.Position(x, y + 1)));
        } else if (word[position.character] == "D") {
            x = position.line
            y = position.character
            return new vscode.Hover({
                language: "hover",
                value: "Asp(abbr. D)\nAspartic acid\nNegatively charged\npKa = 3.7"
            }, new vscode.Range(new vscode.Position(x, y), new vscode.Position(x, y + 1)));
        } else if (word[position.character] == "E") {
            x = position.line
            y = position.character
            return new vscode.Hover({
                language: "hover",
                value: "Glu(abbr. E)\nGlutamic Acid\nNegatively charged\npKa = 4.2"
            }, new vscode.Range(new vscode.Position(x, y), new vscode.Position(x, y + 1)));
        } else if (word[position.character] == "S") {
            x = position.line
            y = position.character
            return new vscode.Hover({
                language: "hover",
                value: "Ser(abbr. S)\nSerine\nPolar uncharged"
            }, new vscode.Range(new vscode.Position(x, y), new vscode.Position(x, y + 1)));
        } else if (word[position.character] == "T") {
            x = position.line
            y = position.character
            return new vscode.Hover({
                language: "hover",
                value: "Thr(abbr. T)\nThreonine\nPolar uncharged"
            }, new vscode.Range(new vscode.Position(x, y), new vscode.Position(x, y + 1)));
        } else if (word[position.character] == "N") {
            x = position.line
            y = position.character
            return new vscode.Hover({
                language: "hover",
                value: "Asn(abbr. H)\nAsparagine\nPolar uncharged"
            }, new vscode.Range(new vscode.Position(x, y), new vscode.Position(x, y + 1)));
        } else if (word[position.character] == "Q") {
            x = position.line
            y = position.character
            return new vscode.Hover({
                language: "hover",
                value: "Gln(abbr. Q)\nGlutamine\nPolar uncharged"
            }, new vscode.Range(new vscode.Position(x, y), new vscode.Position(x, y + 1)));
        } else if (word[position.character] == "G") {
            x = position.line
            y = position.character
            return new vscode.Hover({
                language: "hover",
                value: "Gly(abbr. G)\nGlycine\nPositively charged"
            }, new vscode.Range(new vscode.Position(x, y), new vscode.Position(x, y + 1)));
        } else if (word[position.character] == "C") {
            x = position.line
            y = position.character
            return new vscode.Hover({
                language: "hover",
                value: "Cys(abbr. C)\nCysteine\nSpecial Case"
            }, new vscode.Range(new vscode.Position(x, y), new vscode.Position(x, y + 1)));
        } else if (word[position.character] == "U") {
            x = position.line
            y = position.character
            return new vscode.Hover({
                language: "hover",
                value: "Sec(abbr. U)\nSelenocysteine\nSpecial Case"
            }, new vscode.Range(new vscode.Position(x, y), new vscode.Position(x, y + 1)));
        } else if (word[position.character] == "P") {
            x = position.line
            y = position.character
            return new vscode.Hover({
                language: "hover",
                value: "Pro(abbr. P)\nProline\nSpecial Case"
            }, new vscode.Range(new vscode.Position(x, y), new vscode.Position(x, y + 1)));
        } else if (word[position.character] == "A") {
            x = position.line
            y = position.character
            return new vscode.Hover({
                language: "hover",
                value: "Ala(abbr. A)\nAlanine\nHydrophobic"
            }, new vscode.Range(new vscode.Position(x, y), new vscode.Position(x, y + 1)));
        } else if (word[position.character] == "I") {
            x = position.line
            y = position.character
            return new vscode.Hover({
                language: "hover",
                value: "Ile(abbr. I)\nIsoleucine\nHydrophobic"
            }, new vscode.Range(new vscode.Position(x, y), new vscode.Position(x, y + 1)));
        } else if (word[position.character] == "L") {
            x = position.line
            y = position.character
            return new vscode.Hover({
                language: "hover",
                value: "Leu(abbr. L)\nLeucine\nHydrophobic"
            }, new vscode.Range(new vscode.Position(x, y), new vscode.Position(x, y + 1)));
        } else if (word[position.character] == "M") {
            x = position.line
            y = position.character
            return new vscode.Hover({
                language: "hover",
                value: "Met(abbr. M)\nMethionine\nHydrophobic"
            }, new vscode.Range(new vscode.Position(x, y), new vscode.Position(x, y + 1)));
        } else if (word[position.character] == "F") {
            x = position.line
            y = position.character
            return new vscode.Hover({
                language: "hover",
                value: "Phe(abbr. F)\nPhenylalanine\nHydrophobic"
            }, new vscode.Range(new vscode.Position(x, y), new vscode.Position(x, y + 1)));
        } else if (word[position.character] == "W") {
            x = position.line
            y = position.character
            return new vscode.Hover({
                language: "hover",
                value: "Trp(abbr. W)\nTryptophan\nHydrophobic"
            }, new vscode.Range(new vscode.Position(x, y), new vscode.Position(x, y + 1)));
        } else if (word[position.character] == "Y") {
            x = position.line
            y = position.character
            return new vscode.Hover({
                language: "hover",
                value: "Tyr(abbr. Y)\nTyrosine\nHydrophobic"
            }, new vscode.Range(new vscode.Position(x, y), new vscode.Position(x, y + 1)));
        } else if (word[position.character] == "V") {
            x = position.line
            y = position.character
            return new vscode.Hover({
                language: "hover",
                value: "Val(abbr. V)\nValine\nHydrophobic"
            }, new vscode.Range(new vscode.Position(x, y), new vscode.Position(x, y + 1)));
        }
    }
});
// mdp hover
module.exports = vscode.languages.registerHoverProvider('mdp', {
    provideHover(document, position, token) {
        const word = document.getText(document.getWordRangeAtPosition(position));
        if (word == "define") {
            return {
                contents: ["Defines to control options in your customized topology files. Options that act on existing top file mechanisms include", "Values:", "***-DFLEXIBLE***", "***-DPOSRES***"]
            };
        } else if (word == "DFLEXIBLE") {
            return {
                contents: ["Using flexible water instead of rigid water."]
            };
        } else if (word == "DPOSRES") {
            return {
                contents: ["Implement position restraints which included in the topology"]
            };
        } else if (word == "integrator") {
            return {
                contents: ["Algorithms for integrator", "Values:", "***md***, ***md-vv***, ***md-vv-avek***", "***sd***, ***bd***, ***l-bfgs***", "***steep***,***cg***,***nm***", "***tpi***, ***tpic***, ***mimic***"]
            };
        } else if (word == "md") {
            return {
                contents: ["leap-frog algorithm for integrating Newton’s equations of motion."]
            };
        } else if (word == "steep") {
            return {
                contents: ["A steepest descent algorithm for energy minimization"]
            };
        } else if (word == "tinit") {
            return {
                contents: ["Default 0 [ps]", "starting time for your run"]
            };
        } else if (word == "dt") {
            return {
                contents: ["Default 0.001 [ps]", "time step for integration"]
            };
        } else if (word == "nsteps") {
            return {
                contents: ["Default 0", "maximum number of steps to integrate or minimize", "-1 is no maximum"]
            };
        } else if (word == "Linear") {
            return {
                contents: ["Remove center of mass translational velocity"]
            };
        } else if (word == "Angular") {
            return {
                contents: ["Remove center of mass translational and rotational velocity"]
            };
        } else if (word == "nstcomm") {
            return {
                contents: ["Default 100 [steps] ", "frequency for center of mass motion removal"]
            };
        } else if (word == "emtol") {
            return {
                contents: ["Default 10.0 [kJ mol-1 nm-1] ", "the minimization is converged when the maximum force is smaller than this value"]
            };
        } else if (word == "emstep") {
            return {
                contents: ["Default 0.01 [nm] ", "initial step-size"]
            };
        } else if (word == "nstcgsteep") {
            return {
                contents: ["Default 1000 [steps] ", "frequency of performing 1 steepest descent step while doing conjugate gradient energy minimization"]
            };
        } else if (word == "nstxout") {
            return {
                contents: ["Default 0 [steps] ", "number of steps that elapse between writing coordinates to the output trajectory file(trr)"]
            };
        } else if (word == "nstvout") {
            return {
                contents: ["Default 0 [steps] ", "number of steps that elapse between writing velocities to the output trajectory file(trr)"]
            };
        } else if (word == "nstfout") {
            return {
                contents: ["Default 0 [steps] ", "number of steps that elapse between writing forces to the output trajectory file(trr)"]
            };
        } else if (word == "nstlog") {
            return {
                contents: ["Default 1000 [steps] ", "number of steps that elapse between writing energies to the log file"]
            };
        } else if (word == "nstenergy") {
            return {
                contents: ["Default 1000 [steps] ", "number of steps that elapse between writing energies to energy file"]
            };
        } else if (word == "nstlist") {
            return {
                contents: ["***&#62;0*** Frequency to update the neighbor list", "***0*** The neighbor list is only constructed once and never updated", "***\<0*** Unused"]
            };
        } else if (word == "pbc") {
            return {
                contents: ["Periodic boundary conditions", "Values:", "***xyz*** -Use periodic boundary conditions in all directions", "***no*** -not use", "***xy*** -Use periodic boundary conditions in x and y directions only."]
            };
        } else if (word == "rlist") {
            return {
                contents: ["Default 1 [nm] ", "Cut-off distance for the short-range neighbor list."]
            };
        } else if (word == "coulombtype") {
            return {
                contents: ["Values:", "***Ewald*** -Classical Ewald sum electrostatics.", "***PME*** -Fast smooth Particle-Mesh Ewald (SPME) electrostatics.", "***Reaction-Field*** -Reaction field electrostatics with Coulomb cut-off rcoulomb"]
            };
        } else if (word == "rcoulomb") {
            return {
                contents: ["Default 1 [nm] ", "The distance for the Coulomb cut-off."]
            };
        } else if (word == "vdwtype") {
            return {
                contents: ["Values:", "***PME*** -Fast smooth Particle-mesh Ewald (SPME) for VdW interactions.", "***Shift*** -This functionality is deprecated and replaced by using vdwtype=Cut-off with vdw-modifier=Force-switch.", "***Switch*** -This functionality is deprecated and replaced by using vdwtype=Cut-off with vdw-modifier=Potential-switch."]
            };
        } else if (word == "rvdw") {
            return {
                contents: ["Default 1 [nm] ", "distance for the LJ or Buckingham cut-off"]
            };
        } else if (word == "DispCorr") {
            return {
                contents: ["Values:", "***no*** -don’t apply any correction", "***EnerPres*** -apply long range dispersion corrections for Energy and Pressure", "***Ener*** -apply long range dispersion corrections for Energy only"]
            };
        } else if (word == "tcoupl") {
            return {
                contents: ["Values:", "***no*** -No temperature coupling", "***berendsen*** -Temperature coupling with a Berendsen thermostat to a bath with temperature ref-t, with time constant tau-t.", "***nose-hoover*** -Temperature coupling using a Nose-Hoover extended ensemble.", "***andersen*** -Temperature coupling by randomizing a fraction of the particle velocities at each timestep.", "***v-rescale*** -Temperature coupling using velocity rescaling with a stochastic term"]
            };
        } else if (word == "pcoupl") {
            return {
                contents: ["Values:", "***no*** -No pressure coupling", "***Berendsen*** -Exponential relaxation pressure coupling with time constant tau-p."]
            };
        } else if (word == "pcoupltype") {
            return {
                contents: ["Specifies the kind of isotropy of the pressure coupling used.", "Values:", "***isotropic*** -Isotropic pressure coupling with time constant tau-p.", "***semiisotropic***", "***anisotropic***", "***surface-tension***"]
            };
        } else if (word == "nstpcouple") {
            return {
                contents: ["Default -1 ", "The frequency for coupling the pressure.", "For velocity Verlet integrators nstpcouple is set to 1."]
            };
        } else if (word == "compressibility") {
            return {
                contents: ["Unit [bar-1]", " The compressibility "]
            };
        } else if (word == "annealing") {
            return {
                contents: ["Type of annealing for each temperature group", "Values:", "***no*** -No simulated annealing", "***single*** -A single sequence of annealing points.", "***periodic*** -The annealing will start over at the first reference point once the last reference time is reached"]
            };
        } else if (word == "constraints") {
            return {
                contents: ["Controls which bonds in the topology will be converted to rigid holonomic constraints.", "Values:", "***none*** -No bonds converted to constraints.", "***h-bonds*** -Convert the bonds with H-atoms to constraints.", "***all-bonds*** -Convert all bonds to constraints.", "***h-angles*** -Convert all bonds to constraints and convert the angles that involve H-atoms to bond-constraints.", "***all-angles*** -Convert all bonds to constraints and all angles to bond-constraints."]
            };
        } else if (word == "continuation") {
            return {
                contents: ["Values:", "***no*** -apply constraints to the start configuration and reset shells", "***yes*** -do not apply constraints to the start configuration and do not reset shells, useful for exact coninuation and reruns"]
            };
        } else if (word == "pull") {
            return {
                contents: ["Values:", "***no*** -No center of mass pulling.", "***yes*** -Center of mass pulling will be applied on 1 or more groups using 1 or more pull coordinates."]
            };
        } else if (word == "disre") {
            return {
                contents: ["Values:", "***no*** -ignore distance restraint information in topology file", "***simple*** -simple (per-molecule) distance restraints.", "***ensemble*** -distance restraints over an ensemble of molecules in one simulation box."]
            };
        } else if (word == "freezegrps") {
            return {
                contents: ["Groups that are to be frozen"]
            };
        }
    }
});