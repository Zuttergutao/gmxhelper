const vscode = require('vscode');

const aminoInfoMap = new Map([
    ['W','W\nTrp\nTryptophan\nHydrophobic'],
    ['Y','Y\nTyr\nTyrosine\nHydrophobic'],
    ['F','F\nPhe\nPhenylalanine\nHydrophobic'],

    ['K','K\nLys\nLysine\nPositively charged\npKa = 10.7'],
    ['R','R\nArg\nArginine\nPositively charged\npKa = 12.1'],

    ['H','H\nHis\nHistidine\nPositively charged\npKa = 6.0'],
    ['P','P\nPro\nProline\nNon Polar'],

    ['E','E\nGlu\nGlutamic Acid\nNegatively charged\npKa = 4.2'],
    ['D','D\nAsp\nAspartic acid\nNegatively charged\npKa = 3.7'],

    ['S','S\nSer\nSerine\nPolar uncharged'],
    ['T','T\nThr\nThreonine\nPolar uncharged'],
    ['N','N\nAsn\nAsparagine\nPolar uncharged'],
    ['C','C\nCys\nCysteine\nPolar'],

    ['Q','Q\nGln\nGlutamine\nPolar uncharged'],
    ['U','U\nSec\nSelenocysteine\nSpecial Case'],
    ['O','O\nPyr\nPyrrolysine\nSpecial Case'],

    ['L','L\nLeu\nLeucine\nHydrophobic'],
    ['I','I\nIle\nIsoleucine\nHydrophobic'],
    ['M','M\nMet\nMethionine\nHydrophobic'],
    ['V','V\nVal\nValine\nHydrophobic'],
    ['A','A\nAla\nAlanine\nHydrophobic'],
    ['G','G\nGly\nGlycine\nPositively charged'],
]);

const amberKeyWordsMap = new Map([
    // Control namelist
    ['cntrl',       ['Control namelist', 'Main control section for AMBER simulations']],
    
    // Minimization and dynamics
    ['imin',        ['Minimization flag', 'Values:', '***0*** - Molecular dynamics', '***1*** - Energy minimization', '***5*** - Trajectory analysis']],
    ['irest',       ['Restart flag', 'Values:', '***0*** - New simulation', '***1*** - Restart from previous run']],
    ['ntx',         ['Initial coordinate/velocity read option', 'Values:', '***1*** - Coordinates only', '***5*** - Coordinates and velocities', '***7*** - Coordinates, velocities, and box info']],
    
    // Time step and simulation length
    ['dt',          ['Time step [ps]', 'Default: 0.001 ps', 'Typical values: 0.001-0.002 ps']],
    ['nstlim',      ['Number of MD steps', 'Total simulation length = nstlim × dt']],
    
    // Periodic boundary conditions
    ['ntb',         ['Periodic boundary conditions', 'Values:', '***0*** - No periodicity', '***1*** - Constant volume', '***2*** - Constant pressure']],
    ['ntp',         ['Pressure regulation', 'Values:', '***0*** - No pressure scaling', '***1*** - Isotropic scaling', '***2*** - Anisotropic scaling']],
    ['barostat',    ['Barostat type', 'Values:', '***1*** - Berendsen', '***2*** - Monte Carlo']],
    ['pres0',       ['Reference pressure [bar]', 'Default: 1.0 bar']],
    ['taup',        ['Pressure relaxation time [ps]', 'Default: 1.0 ps']],
    
    // Cutoffs
    ['cut',         ['Nonbonded cutoff [Å]', 'Distance cutoff for nonbonded interactions']],
    
    // SHAKE constraints
    ['ntc',         ['SHAKE flag', 'Values:', '***1*** - No SHAKE', '***2*** - Bonds with hydrogen', '***3*** - All bonds']],
    ['ntf',         ['Force evaluation', 'Values:', '***1*** - Complete interaction', '***2*** - Omit bonds with hydrogen', '***8*** - Omit bonds and angles with hydrogen']],
    
    // Temperature control
    ['tempi',       ['Initial temperature [K]', 'Starting temperature for the system']],
    ['temp0',       ['Reference temperature [K]', 'Target temperature for thermostat']],
    ['ntt',         ['Temperature scaling', 'Values:', '***0*** - No temperature scaling', '***1*** - Weak coupling', '***2*** - Andersen', '***3*** - Langevin dynamics']],
    ['gamma_ln',    ['Langevin collision frequency [ps⁻¹]', 'Used with ntt=3']],
    ['tautp',       ['Temperature relaxation time [ps]', 'Used with ntt=1']],
    
    // Output control
    ['ntpr',        ['Print frequency', 'Print energies every ntpr steps']],
    ['ntwx',        ['Coordinate write frequency', 'Write coordinates every ntwx steps']],
    ['ntwr',        ['Restart write frequency', 'Write restart file every ntwr steps']],
    ['ntxo',        ['Restart format', 'Values:', '***1*** - ASCII', '***2*** - NetCDF']],
    ['ioutfm',      ['Trajectory format', 'Values:', '***0*** - ASCII', '***1*** - NetCDF']],
    ['iwrap',       ['Coordinate wrapping', 'Values:', '***0*** - No wrapping', '***1*** - Wrap coordinates']],
    
    // Restraints
    ['ntr',         ['Restraint flag', 'Values:', '***0*** - No restraints', '***1*** - Harmonic restraints']],
    ['restraint_wt',['Restraint weight [kcal/mol/Å²]', 'Force constant for positional restraints']],
    ['restraintmask',['Restraint mask', 'Amber mask syntax for restrained atoms']],
    
    // Enhanced sampling - GaMD
    ['igamd',       ['Gaussian accelerated MD', 'Values:', '***0*** - Off', '***11*** - Dual-boost GaMD', '***21*** - Lower-bound GaMD']],
    ['iEP',         ['Potential boost type', 'Enhanced sampling parameter']],
    ['iED',         ['Dihedral boost type', 'Enhanced sampling parameter']],
    ['ntcmdprep',   ['cMD preparation steps', 'Conventional MD steps before GaMD']],
    ['ntcmd',       ['cMD equilibration steps', 'Conventional MD steps for statistics']],
    ['ntebprep',    ['Enhanced boost preparation', 'Steps before applying boost']],
    ['nteb',        ['Enhanced boost steps', 'Steps with boost applied']],
    ['ntave',       ['Average interval', 'Steps for averaging statistics']],
    ['irest_gamd',  ['GaMD restart flag', 'Values:', '***0*** - New GaMD run', '***1*** - Restart GaMD']],
    ['sigma0P',     ['Potential boost parameter', 'Upper limit for potential boost']],
    ['sigma0D',     ['Dihedral boost parameter', 'Upper limit for dihedral boost']],
    
    // Free energy calculations
    ['icfe',        ['Free energy flag', 'Values:', '***0*** - No free energy', '***1*** - Free energy calculation']],
    ['ifsc',        ['Soft core potentials', 'Values:', '***0*** - Linear scaling', '***1*** - Soft core scaling']],
    ['timask1',     ['TI mask 1', 'Atoms for thermodynamic integration state 1']],
    ['timask2',     ['TI mask 2', 'Atoms for thermodynamic integration state 2']],
    ['scmask1',     ['Soft core mask 1', 'Atoms for soft core in state 1']],
    ['scmask2',     ['Soft core mask 2', 'Atoms for soft core in state 2']],
    
    // Ligand binding
    ['nlig',        ['Number of ligands', 'Number of ligand molecules']],
    ['ibblig',      ['Ligand binding flag', 'Enable ligand binding analysis']],
    ['atom_p',      ['Protein atoms', 'Number of protein atoms']],
    ['atom_l',      ['Ligand atoms', 'Number of ligand atoms']],
    ['dblig',       ['Ligand distance [Å]', 'Distance criterion for ligand binding']],
    
    // Minimization specific
    ['maxcyc',      ['Maximum cycles', 'Maximum number of minimization cycles']],
    ['ncyc',        ['Steepest descent cycles', 'Number of steepest descent steps before conjugate gradient']],
    ['drms',        ['RMS gradient convergence', 'Convergence criterion for minimization [kcal/mol/Å]']],
    
    // Advanced options
    ['gti_cpu_output', ['GTI CPU output', 'Control output for GPU TI calculations']],
    ['gti_add_sc',  ['GTI soft core addition', 'Add soft core for GPU TI calculations']]
]);

const keyWordsMap = new Map([
    ['define',      ['Defines to control options in your customized topology files. Options that act on existing top file mechanisms include', 'Values:', '***-DFLEXIBLE***', '***-DPOSRES***']],
    ['DFLEXIBLE',   ['Using flexible water instead of rigid water.']],
    ['DPOSRES',     ['Implement position restraints which included in the topology']],

    ['integrator',  ['Algorithms for integrator', 'Values:', '***md***, ***md-vv***, ***md-vv-avek***', '***sd***, ***bd***, ***l-bfgs***', '***steep***,***cg***,***nm***', '***tpi***, ***tpic***, ***mimic***']],
    ['steep',       ['A steepest descent algorithm for energy minimization']],
    ['tinit',       ['Default 0 [ps]', 'starting time for your run']],

    ['md',          ['leap-frog algorithm for integrating Newton’s equations of motion.']],
    ['dt',          ['Default 0.001 [ps]', 'time step for integration']],
    ['pbc',         ['Periodic boundary conditions', 'Values:', '***xyz*** -Use periodic boundary conditions in all directions', '***no*** -not use', '***xy*** -Use periodic boundary conditions in x and y directions only.']],
    ['rvdw',        ['Default 1 [nm] ', 'distance for the LJ or Buckingham cut-off']],

    ['nsteps',      ['Default 0', 'maximum number of steps to integrate or minimize', '-1 is no maximum']],

    ['Linear',      ['Remove center of mass translational velocity']],
    ['Angular',     ['Remove center of mass translational and rotational velocity']],

    ['nstcomm',     ['Default 100 [steps] ', 'frequency for center of mass motion removal']],
    ['emtol',       ['Default 10.0 [kJ mol-1 nm-1] ', 'the minimization is converged when the maximum force is smaller than this value']],
    ['emstep',      ['Default 0.01 [nm] ', 'initial step-size']],

    ['nstcgsteep',  ['Default 1000 [steps] ', 'frequency of performing 1 steepest descent step while doing conjugate gradient energy minimization']],
    ['nstxout',     ['Default 0 [steps] ', 'number of steps that elapse between writing coordinates to the output trajectory file(trr)']],
    ['nstvout',     ['Default 0 [steps] ', 'number of steps that elapse between writing velocities to the output trajectory file(trr)']],
    ['nstfout',     ['Default 0 [steps] ', 'number of steps that elapse between writing forces to the output trajectory file(trr)']],
    ['nstlog',      ['Default 1000 [steps] ', 'number of steps that elapse between writing energies to the log file']],

    ['nstlist',     ['***>0*** Frequency to update the neighbor list', '***0*** The neighbor list is only constructed once and never updated', '***<0*** Unused']],
    ['rlist',       ['Default 1 [nm] ', 'Cut-off distance for the short-range neighbor list.']],

    ['coulombtype', ['Values:', '***Ewald*** -Classical Ewald sum electrostatics.', '***PME*** -Fast smooth Particle-Mesh Ewald (SPME) electrostatics.', '***Reaction-Field*** -Reaction field electrostatics with Coulomb cut-off rcoulomb']],
    ['rcoulomb',    ['Default 1 [nm] ', 'The distance for the Coulomb cut-off.']],
    ['vdwtype',     ['Values:', '***PME*** -Fast smooth Particle-mesh Ewald (SPME) for VdW interactions.', '***Shift*** -This functionality is deprecated and replaced by using vdwtype=Cut-off with vdw-modifier=Force-switch.', '***Switch*** -This functionality is deprecated and replaced by using vdwtype=Cut-off with vdw-modifier=Potential-switch.']],
    ['DispCorr',    ['Values:', '***no*** -don’t apply any correction', '***EnerPres*** -apply long range dispersion corrections for Energy and Pressure', '***Ener*** -apply long range dispersion corrections for Energy only']],

    ['tcoupl',      ['Values:', '***no*** -No temperature coupling', '***berendsen*** -Temperature coupling with a Berendsen thermostat to a bath with temperature ref-t, with time constant tau-t.', '***nose-hoover*** -Temperature coupling using a Nose-Hoover extended ensemble.', '***andersen*** -Temperature coupling by randomizing a fraction of the particle velocities at each timestep.', '***v-rescale*** -Temperature coupling using velocity rescaling with a stochastic term']],
    ['pcoupl',      ['Values:', '***no*** -No pressure coupling', '***Berendsen*** -Exponential relaxation pressure coupling with time constant tau-p.']],
    ['pcoupltype',  ['Specifies the kind of isotropy of the pressure coupling used.', 'Values:', '***isotropic*** -Isotropic pressure coupling with time constant tau-p.', '***semiisotropic***', '***anisotropic***', '***surface-tension***']],
    ['nstpcouple',  ['Default -1 ', 'The frequency for coupling the pressure.', 'For velocity Verlet integrators nstpcouple is set to 1.']],
    ['compressibility',['Unit [bar-1]', ' The compressibility ']],

    ['annealing',   ['Type of annealing for each temperature group', 'Values:', '***no*** -No simulated annealing', '***single*** -A single sequence of annealing points.', '***periodic*** -The annealing will start over at the first reference point once the last reference time is reached']],
    ['constraints', ['Controls which bonds in the topology will be converted to rigid holonomic constraints.', 'Values:', '***none*** -No bonds converted to constraints.', '***h-bonds*** -Convert the bonds with H-atoms to constraints.', '***all-bonds*** -Convert all bonds to constraints.', '***h-angles*** -Convert all bonds to constraints and convert the angles that involve H-atoms to bond-constraints.', '***all-angles*** -Convert all bonds to constraints and all angles to bond-constraints.']],
    ['continuation',['Values:', '***no*** -apply constraints to the start configuration and reset shells', '***yes*** -do not apply constraints to the start configuration and do not reset shells, useful for exact coninuation and reruns']],

    ['pull',        ['Values:', '***no*** -No center of mass pulling.', '***yes*** -Center of mass pulling will be applied on 1 or more groups using 1 or more pull coordinates.']],
    ['disre',       ['Values:', '***no*** -ignore distance restraint information in topology file', '***simple*** -simple (per-molecule) distance restraints.', '***ensemble*** -distance restraints over an ensemble of molecules in one simulation box.']],
    ['freezegrps',  ['Groups that are to be frozen']],
]);

// Quantum Chemistry Keywords Map
const quantumKeyWordsMap = new Map([
    // Gaussian Keywords
    ['B3LYP',       ['Becke 3-parameter Lee-Yang-Parr hybrid functional', 'Popular DFT method combining exact exchange with DFT correlation']],
    ['PBE1PBE',     ['Perdew-Burke-Ernzerhof hybrid functional', 'Also known as PBE0, contains 25% exact exchange']],
    ['M06',         ['Minnesota 06 functional', 'Meta-GGA functional good for main group thermochemistry']],
    ['wB97XD',      ['Range-separated hybrid functional with dispersion', 'Good for non-covalent interactions']],
    ['6-31G',       ['Pople basis set', 'Split-valence basis set with polarization functions']],
    ['6-311G',      ['Pople basis set', 'Triple-zeta valence basis set']],
    ['cc-pVDZ',     ['Correlation-consistent polarized valence double-zeta', 'Dunning basis set family']],
    ['cc-pVTZ',     ['Correlation-consistent polarized valence triple-zeta', 'Larger Dunning basis set']],
    ['opt',         ['Geometry optimization', 'Find the minimum energy structure']],
    ['freq',        ['Frequency calculation', 'Calculate vibrational frequencies and thermochemistry']],
    ['TD',          ['Time-dependent DFT', 'Calculate electronic excitation energies']],
    ['IRC',         ['Intrinsic reaction coordinate', 'Follow reaction path from transition state']],
    ['scan',        ['Potential energy surface scan', 'Systematic variation of coordinates']],
    
    // ORCA Keywords
    ['BLYP',        ['Becke-Lee-Yang-Parr functional', 'GGA functional combining Becke exchange with LYP correlation']],
    ['BP86',        ['Becke-Perdew 86 functional', 'GGA functional with Becke exchange and Perdew correlation']],
    ['def2-SVP',    ['Def2 split-valence polarized basis set', 'Ahlrichs basis set, good balance of accuracy and speed']],
    ['def2-TZVP',   ['Def2 triple-zeta valence polarized', 'Larger Ahlrichs basis set for higher accuracy']],
    ['RIJCOSX',     ['Resolution of Identity with Chain of Spheres Exchange', 'Approximation to speed up hybrid DFT calculations']],
    ['DLPNO',       ['Domain-based Local Pair Natural Orbital', 'Local correlation method for large systems']],
    ['TightSCF',    ['Tight SCF convergence criteria', 'More stringent convergence for SCF iterations']],
    ['NumFreq',     ['Numerical frequencies', 'Calculate frequencies by numerical differentiation']],
    ['CPCM',        ['Conductor-like Polarizable Continuum Model', 'Implicit solvation model']],
    ['SMD',         ['Solvation Model based on Density', 'Universal solvation model']],
    
    // CP2K Keywords
    ['GLOBAL',      ['Global settings section', 'Contains project name, run type, and print level']],
    ['FORCE_EVAL',  ['Force evaluation section', 'Defines the method and system for calculation']],
    ['Quickstep',   ['CP2K DFT method', 'Density functional theory implementation in CP2K']],
    ['SUBSYS',      ['Subsystem definition', 'Contains cell, coordinates, and atomic kinds']],
    ['CELL',        ['Unit cell definition', 'Lattice vectors for periodic systems']],
    ['COORD',       ['Atomic coordinates', 'Positions of atoms in the system']],
    ['KIND',        ['Atomic kind definition', 'Basis set and pseudopotential for each element']],
    ['DFT',         ['Density functional theory settings', 'Contains XC functional, basis sets, and grid settings']],
    ['SCF',         ['Self-consistent field settings', 'Convergence criteria and algorithms']],
    ['XC',          ['Exchange-correlation functional', 'Choice of DFT functional']],
    ['MGRID',       ['Multigrid settings', 'Real-space grid for electron density']],
    ['CUTOFF',      ['Plane wave cutoff', 'Energy cutoff for plane wave basis [Ry]']],
    ['REL_CUTOFF',  ['Relative cutoff', 'Cutoff for Gaussian basis functions [Ry]']],
    ['GEO_OPT',     ['Geometry optimization', 'Find minimum energy structure']],
    ['MD',          ['Molecular dynamics', 'Time evolution of the system']],
    ['MOTION',      ['Motion section', 'Contains MD, optimization, or other dynamics settings']],
    ['NVT',         ['Canonical ensemble', 'Constant number, volume, and temperature']],
    ['NVE',         ['Microcanonical ensemble', 'Constant number, volume, and energy']],
    ['NPT',         ['Isothermal-isobaric ensemble', 'Constant number, pressure, and temperature']],
    ['BFGS',        ['Broyden-Fletcher-Goldfarb-Shanno', 'Quasi-Newton optimization algorithm']],
    ['THERMOSTAT',  ['Temperature control', 'Method to maintain constant temperature']],
    ['NOSE',        ['Nosé-Hoover thermostat', 'Extended system thermostat']]
]);

function createHover(contents, position){
    const x = position.line;
    const y = position.character;
    if(!contents) return;
    return new vscode.Hover({
        language: 'hover',
        value: Array.isArray(contents) ? contents.join('\n') : contents
    },
    position ? new vscode.Range(position, new vscode.Position(x, y + 1)) : undefined
    );
}

const fastaProvider = vscode.languages.registerHoverProvider('fasta', {
    provideHover(document, position/*, token*/) {//Token should only be used for async hovers which allow cancellation of hover logic
        try{
            const word = document.getText(document.getWordRangeAtPosition(position));
            const aa = word[position.character];
            const description = aminoInfoMap.get(aa);
            return createHover(description, position);
        }catch(error){
            if (process.env.NODE_ENV === 'development') {
                console.error('Error: Not in AminoMap', error.name);
            }
        }
    }
});

// mdp hover
const mdpProvider = vscode.languages.registerHoverProvider('mdp', {
    provideHover(document, position/*, token*/) {//Token should only be used for async hovers which allow cancellation of hover logic
        try{
            const word = document.getText(document.getWordRangeAtPosition(position));
            const description = keyWordsMap.get(word);
            // return createHover(description,position)
            return {contents: description};
        }catch(error){
            console.error('Error: Not in KeyWordMap', error.name);
            return;
        }
    }
});

// Quantum Chemistry hover providers
const gjfProvider = vscode.languages.registerHoverProvider('gjf', {
    provideHover(document, position) {
        try{
            const word = document.getText(document.getWordRangeAtPosition(position));
            const description = quantumKeyWordsMap.get(word);
            return createHover(description, position);
        }catch(error){
            if (process.env.NODE_ENV === 'development') {
                console.error('Error: Not in QuantumKeyWordMap', error.name);
            }
        }
    }
});

const inpProvider = vscode.languages.registerHoverProvider('inp', {
    provideHover(document, position) {
        try{
            const word = document.getText(document.getWordRangeAtPosition(position));
            const description = quantumKeyWordsMap.get(word);
            return createHover(description, position);
        }catch(error){
            if (process.env.NODE_ENV === 'development') {
                console.error('Error: Not in QuantumKeyWordMap', error.name);
            }
        }
    }
});

const orcaInpProvider = vscode.languages.registerHoverProvider('orca-inp', {
    provideHover(document, position) {
        try{
            const word = document.getText(document.getWordRangeAtPosition(position));
            const description = quantumKeyWordsMap.get(word);
            return createHover(description, position);
        }catch(error){
            if (process.env.NODE_ENV === 'development') {
                console.error('Error: Not in QuantumKeyWordMap', error.name);
            }
        }
    }
});

const cp2kInpProvider = vscode.languages.registerHoverProvider('cp2k-inp', {
    provideHover(document, position) {
        try{
            const word = document.getText(document.getWordRangeAtPosition(position));
            const description = quantumKeyWordsMap.get(word);
            return createHover(description, position);
        }catch(error){
            if (process.env.NODE_ENV === 'development') {
                console.error('Error: Not in QuantumKeyWordMap', error.name);
            }
        }
    }
});

const amberInProvider = vscode.languages.registerHoverProvider('amber-in', {
    provideHover(document, position) {
        try{
            const word = document.getText(document.getWordRangeAtPosition(position));
            const description = amberKeyWordsMap.get(word);
            return createHover(description, position);
        }catch(error){
            if (process.env.NODE_ENV === 'development') {
                console.error('Error: Not in AmberKeyWordMap', error.name);
            }
        }
    }
});

module.exports = [fastaProvider, mdpProvider, gjfProvider, inpProvider, orcaInpProvider, cp2kInpProvider, amberInProvider];
