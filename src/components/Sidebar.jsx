// src/components/Sidebar.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getElectedCandidates } from '../utils/electionHelpers';
import { calculateSeats } from '../utils/seatAllocation';
import SeatDistributionChart from './SeatDistributionChart';

// Timer-Gauge-Komponente für Live-Ergebnisse
const LiveResultsTimer = ({ nextUpdateTime, lastUpdateTime }) => {
    const [timeLeft, setTimeLeft] = useState(0);
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        if (!nextUpdateTime) return;
        
        const updateTimer = () => {
            const now = new Date();
            const timeLeft = Math.max(0, nextUpdateTime.getTime() - now.getTime());
            setTimeLeft(timeLeft);
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);

        return () => clearInterval(interval);
    }, [nextUpdateTime]);

    if (!nextUpdateTime) return null;
    
    const secondsLeft = Math.ceil(timeLeft / 1000);
    const progress = Math.max(0, Math.min(1, timeLeft / 60000)); // 0-1 basierend auf 60 Sekunden (umgekehrte Logik)

    const formatTime = (seconds) => {
        if (seconds <= 0) return '0s';
        if (seconds < 60) return `${seconds}s`;
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const formatLastUpdate = (date) => {
        if (!date) return '';
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        
        if (minutes > 0) {
            return `vor ${minutes}m ${seconds}s`;
        } else {
            return `vor ${seconds}s`;
        }
    };

    return (
        <Tooltip
            title={
                <Box>
                    <Typography variant="caption" display="block">
                        Nächste Aktualisierung: {formatTime(secondsLeft)}
                    </Typography>
                    {lastUpdateTime && (
                        <Typography variant="caption" display="block" sx={{ opacity: 0.7 }}>
                            Letzte Aktualisierung: {formatLastUpdate(lastUpdateTime)}
                        </Typography>
                    )}
                </Box>
            }
            placement="top"
            arrow
        >
            <Box
                sx={{
                    position: 'relative',
                    width: 20,
                    height: 20,
                    ml: 1,
                    cursor: 'pointer',
                    opacity: isHovered ? 0.8 : 0.4,
                    transition: 'opacity 0.2s ease',
                }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onTouchStart={() => setIsHovered(true)}
                onTouchEnd={() => setTimeout(() => setIsHovered(false), 2000)}
            >
                {/* Hintergrund-Kreis */}
                <svg width="20" height="20" style={{ transform: 'rotate(-90deg)' }}>
                    <circle
                        cx="10"
                        cy="10"
                        r="8"
                        fill="none"
                        stroke="#f5f5f5"
                        strokeWidth="1.5"
                    />
                    {/* Progress-Kreis */}
                    <circle
                        cx="10"
                        cy="10"
                        r="8"
                        fill="none"
                        stroke="#757575"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 8}`}
                        strokeDashoffset={`${2 * Math.PI * 8 * (1 - progress)}`}
                        style={{ transition: 'stroke-dashoffset 0.3s ease' }}
                    />
                </svg>
                {/* Zeit-Text */}
                <Box
                    sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        fontSize: '0.55rem',
                        fontWeight: 'normal',
                        color: '#757575',
                        textAlign: 'center',
                        lineHeight: 1,
                        minWidth: '12px'
                    }}
                >
                    {secondsLeft}
                </Box>
            </Box>
        </Tooltip>
    );
};

import InfoIcon from '@mui/icons-material/Info';
import {
    Alert,
    Autocomplete,
    Box,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    FormControl,
    FormControlLabel,
    IconButton,
    InputAdornment,
    InputLabel,
    List,
    ListItem,
    ListItemText,
    MenuItem,
    Paper,
    Popover,
    Select,
    Switch,
    TextField,
    Tooltip,
    Typography
} from '@mui/material';
import { debounce } from 'lodash';

// Memoized Party-Listenelement für bessere Performance
const PartyListItem = React.memo(({
    party,
    partyPercentage,
    handlePercentageChange,
    seatAllocation,
    directMandates,
    seatDistribution,
    handleOpenPopover,
    effectiveTotalPercentage,
    isLiveResultsActive,
    livePartyPercentages
}) => {
    return (
        <ListItem
            disablePadding
            sx={{ mb: 1.5 }}
        >
            <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box
                        sx={{
                            width: 16,
                            height: 16,
                            borderRadius: '50%',
                            bgcolor: party.colorcode,
                            mr: 1
                        }}
                    />
                    <Typography variant="body2">
                        {party.short}
                    </Typography>



                    {/* Zeige Anzahl der gewonnenen Wahlkreise an - für beide Verfahren */}
                    {seatAllocation && directMandates[party.identifier] > 0 && (
                        <Chip
                            label={`${directMandates[party.identifier]} WK`}
                            size="small"
                            sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                        />
                    )}
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <TextField
                        type="number"
                        size="small"
                        inputProps={{
                            min: 0,
                            max: 100,
                            step: 0.1,
                            style: { textAlign: 'right', padding: '4px 8px' }
                        }}
                        sx={{
                            width: 95,
                            '& input::-webkit-inner-spin-button, & input::-webkit-outer-spin-button': {
                                WebkitAppearance: 'none',
                                margin: 0,
                            },
                            '& input[type=number]': {
                                MozAppearance: 'textfield',
                            }
                        }}
                        value={
                            isLiveResultsActive && livePartyPercentages[party.identifier] !== undefined
                                ? livePartyPercentages[party.identifier]
                                : (partyPercentage || '')
                        }
                        onChange={(e) => handlePercentageChange(party.identifier, e.target.value)}
                        disabled={isLiveResultsActive}
                        InputProps={{
                            endAdornment: <InputAdornment position="end">%</InputAdornment>,
                        }}
                    />

                    {/* Sitzanzeige mit Popover für Kandidaten */}
                    {effectiveTotalPercentage <= 100 && seatDistribution[party.identifier] !== undefined && (
                        <Box sx={{ ml: 2 }}>
                            <Chip
                                label={`${seatDistribution[party.identifier]} Sitze`}
                                onClick={(e) => handleOpenPopover(e, party.identifier)}
                                sx={{
                                    bgcolor: 'grey.100',
                                    '&:hover': { bgcolor: 'grey.200' }
                                }}
                            />
                        </Box>
                    )}
                </Box>
            </Box>
        </ListItem>
    );
});

// Memoized Kandidaten-Popover-Inhalt
const CandidatesPopoverContent = React.memo(({
    party,
    candidates
}) => {
    return (
        <>
            <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                {party.short} - Gewählte Kandidat*innen:
            </Typography>

            {candidates.districtCandidates.length > 0 && (
                <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" fontWeight="medium">
                        Wahlkreise:
                    </Typography>
                    <List dense sx={{ mt: 0.5 }}>
                        {candidates.districtCandidates.map((candidate, index) => (
                            <ListItem key={index} sx={{ py: 0.5 }}>
                                <ListItemText
                                    primary={
                                        <Typography variant="body2">
                                            👤 {candidate.name} ({candidate.district.number} {candidate.district.name})
                                        </Typography>
                                    }
                                />
                            </ListItem>
                        ))}
                    </List>
                </Box>
            )}

            {candidates.listCandidates.length > 0 && (
                <Box>
                    <Typography variant="body2" fontWeight="medium">
                        Liste:
                    </Typography>
                    <List dense sx={{ mt: 0.5 }}>
                        {candidates.listCandidates.map((candidate, index) => (
                            <ListItem key={index} sx={{ py: 0.5 }}>
                                <ListItemText
                                    primary={
                                        <Typography variant="body2">
                                            👤 {candidate.position}. {candidate.name}
                                        </Typography>
                                    }
                                />
                            </ListItem>
                        ))}
                    </List>
                </Box>
            )}
        </>
    );
});

// Ausgelagerte Popover-Komponente
const CandidatesPopover = React.memo(({
    open,
    anchorEl,
    handleClosePopover,
    selectedPartyForPopover,
    corporationData,
    seatDistribution,
    directMandates,
    districtWinners
}) => {
    const popoverId = open ? 'candidates-popover' : undefined;

    // Memoized Berechnung der gewählten Kandidaten
    const electedCandidates = useMemo(() => {
        if (!selectedPartyForPopover || !corporationData || !seatDistribution) {
            return { districtCandidates: [], listCandidates: [] };
        }

        return getElectedCandidates(
            selectedPartyForPopover,
            seatDistribution,
            directMandates,
            corporationData,
            districtWinners
        );
    }, [selectedPartyForPopover, seatDistribution, directMandates, corporationData, districtWinners]);

    const selectedParty = corporationData?.parties?.find(p => p.identifier === selectedPartyForPopover);

    return (
        <Popover
            id={popoverId}
            open={open}
            anchorEl={anchorEl}
            onClose={handleClosePopover}
            anchorOrigin={{
                vertical: 'center',
                horizontal: 'center',
            }}
            transformOrigin={{
                vertical: 'center',
                horizontal: 'center',
            }}
            PaperProps={{
                sx: { maxHeight: '80vh' } // Begrenzt die maximale Höhe auf 80% der Bildschirmhöhe
            }}
        >
            {selectedParty && (
                <Card sx={{ width: 500, maxWidth: '90vw' }}>
                    <CardContent sx={{ p: 3 }}>
                        <CandidatesPopoverContent
                            party={selectedParty}
                            candidates={electedCandidates}
                        />
                    </CardContent>
                </Card>
            )}
        </Popover>
    );
});

// Memoized Komponenten für bessere Performance
const ElectionSelect = React.memo(({ selectedElection, setSelectedElection, elections }) => (
    <FormControl fullWidth margin="normal" size="small">
        <InputLabel id="election-select-label">Wahl auswählen</InputLabel>
        <Select
            labelId="election-select-label"
            id="election-select"
            value={selectedElection}
            label="Wahl auswählen"
            onChange={(e) => setSelectedElection(e.target.value)}
        >
            <MenuItem value="">
                <em>-- Bitte wählen --</em>
            </MenuItem>
            {Object.keys(elections).map(key => (
                <MenuItem key={key} value={key}>
                    {elections[key]['election-name']}
                </MenuItem>
            ))}
        </Select>
    </FormControl>
));

const CorporationSelect = React.memo(({ selectedCorporation, onCorporationChange, corporations }) => (
    <FormControl fullWidth margin="normal" size="small">
        <Autocomplete
            id="corporation-select"
            value={selectedCorporation ? { key: selectedCorporation, name: corporations[selectedCorporation]?.name } : null}
            onChange={(event, newValue) => {
                onCorporationChange(newValue ? newValue.key : "");
            }}
            options={Object.keys(corporations).map(key => ({
                key: key,
                name: corporations[key].name
            }))}
            getOptionLabel={(option) => option.name || ""}
            renderInput={(params) => (
                <TextField
                    {...params}
                    label="Körperschaft auswählen"
                    size="small"
                />
            )}
            renderOption={(props, option) => {
                // Extrahiere key aus props und speichere den Rest in restProps
                const { key, ...restProps } = props;
                return (
                    <MenuItem key={option.key} {...restProps} value={option.key}>
                        {option.name}
                    </MenuItem>
                );
            }}
            noOptionsText="Keine Körperschaften gefunden"
        />
    </FormControl>
));

// Live-Ergebnisse Switch Komponente
const LiveResultsSwitch = React.memo(({
    liveResultsEnabled,
    onLiveResultsChange,
    isLiveResultsAvailable,
    isLiveResultsActive,
    isLoading,
    nextUpdateTime,
    lastUpdateTime
}) => (
    <Box sx={{ mt: 2, mb: 2 }}>
        <FormControlLabel
            control={
                <Switch
                    checked={liveResultsEnabled}
                    onChange={(e) => onLiveResultsChange(e.target.checked)}
                    disabled={!isLiveResultsAvailable || isLoading}
                    color="primary"
                />
            }
            label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body2">
                        Live Ergebnisse
                    </Typography>
                    {isLiveResultsActive && liveResultsEnabled && (
                        <Box
                            sx={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                bgcolor: 'error.main',
                                ml: 1,
                                animation: 'pulse 1.5s ease-in-out infinite',
                                '@keyframes pulse': {
                                    '0%': { opacity: 1 },
                                    '50%': { opacity: 0.3 },
                                    '100%': { opacity: 1 }
                                }
                            }}
                        />
                    )}
                    {isLiveResultsActive && nextUpdateTime && (
                        <LiveResultsTimer 
                            nextUpdateTime={nextUpdateTime}
                            lastUpdateTime={lastUpdateTime}
                        />
                    )}
                    {isLoading && (
                        <CircularProgress size={12} sx={{ ml: 1 }} />
                    )}
                </Box>
            }
        />
    </Box>
));



const SeatAllocationInfo = React.memo(({ selectedElection, seatAllocation }) => (
    selectedElection && seatAllocation && (
        <Box sx={{ mt: 2, mb: 2 }}>
            <Typography variant="subtitle1" fontWeight="medium">
                Sitzzuteilungsverfahren:
            </Typography>
            <Typography variant="body2">
                {seatAllocation.name}
            </Typography>
        </Box>
    )
));

const CorporationInfo = React.memo(({
    corporationData,
    totalAllocatedSeats,
    effectiveTotalPercentage,
    seatDistribution,
    seatAllocation,
    numDirectSeats,
    totalDirectMandates,
    successfulIndependents = 0 
}) => (
    corporationData && (
        <Box sx={{ mt: 2, mb: 3 }}>
            <Typography variant="subtitle1" fontWeight="medium">
                Anzahl der Ratssitze:
            </Typography>
            <Typography variant="body1">
                {totalAllocatedSeats + successfulIndependents}
            </Typography>

            {/* Chart für die Sitzverteilung */}
            {effectiveTotalPercentage <= 100 && Object.keys(seatDistribution).length > 0 && (
                <Box sx={{ mt: 3 }}>
                    <SeatDistributionChart
                        seatDistribution={seatDistribution}
                        parties={corporationData.parties}
                        independentSeats={successfulIndependents}
                    />
                </Box>
            )}

            {/* Zeige Anzahl der Wahlkreise an, wenn Rock-Verfahren verwendet wird */}
            {seatAllocation && seatAllocation.key === 'rock' && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Wahlkreise: {numDirectSeats}
                    {totalDirectMandates > 0 && ` (${totalDirectMandates} vergeben)`}
                </Typography>
            )}
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Gesetzliche Sitzzahl: {corporationData['council-seats']}
            </Typography>
        </Box>
    )
));

const SeatSummary = React.memo(({
    effectiveTotalPercentage,
    totalAllocatedSeats,
    corporationData,
    seatAllocation,
    successfulIndependents = 0
}) => (
    effectiveTotalPercentage <= 100 && totalAllocatedSeats > 0 && (
        <Paper
            variant="outlined"
            sx={{ mt: 3, p: 2, bgcolor: 'grey.50' }}
        >
            <Typography variant="subtitle1" fontWeight="medium">
                Sitzverteilung ({seatAllocation.name}):
            </Typography>
            <Typography variant="body2">
                Insgesamt verteilt: {totalAllocatedSeats + successfulIndependents} von {corporationData['council-seats']} Sitzen
                {successfulIndependents > 0 && ` (davon ${successfulIndependents} Einzelbewerber)`}
            </Typography>

            {/* Zeige Hinweis zu Überhangmandaten, wenn Rock-Verfahren verwendet wird */}
            {seatAllocation && seatAllocation.key === 'rock' && totalAllocatedSeats + successfulIndependents > corporationData['council-seats'] && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Inkl. {totalAllocatedSeats + successfulIndependents - corporationData['council-seats']} Ausgleichsmandate
                </Typography>
            )}
        </Paper>
    )
));

function Sidebar({
    elections,
    selectedElection,
    setSelectedElection,
    corporations,
    selectedCorporation,
    onCorporationChange,
    corporationData,
    districtVotes,
    districtWinners,
    independentCandidates,
    onLiveResultsDataChange,
    onLiveResultsActiveChange
}) {
    // Erhalte das Sitzzuteilungsverfahren aus der ausgewählten Wahl
    const seatAllocation = selectedElection && elections[selectedElection] && elections[selectedElection]['seat-allocation'];

    // State für die Prozentwerte der Parteien
    const [partyPercentages, setPartyPercentages] = useState({});
    // State für die Summe der Prozentwerte
    const [totalPercentage, setTotalPercentage] = useState(0);
    // State für die berechnete Sitzverteilung
    const [seatDistribution, setSeatDistribution] = useState({});
    // State für die Wahlkreissieger
    const [directMandates, setDirectMandates] = useState({});
    // State für die Partei, über deren Sitze gehovert wird
    const [hoveredParty, setHoveredParty] = useState('');
    // State für das Popover
    const [anchorEl, setAnchorEl] = useState(null);
    // State für die aktuell ausgewählte Partei im Popover
    const [selectedPartyForPopover, setSelectedPartyForPopover] = useState('');

    // Live-Ergebnisse State
    const [liveResultsEnabled, setLiveResultsEnabled] = useState(false);
    const [isLiveResultsAvailable, setIsLiveResultsAvailable] = useState(false);
    const [isLiveResultsActive, setIsLiveResultsActive] = useState(false);
    const [isLoadingLiveResults, setIsLoadingLiveResults] = useState(false);
    const [liveResultsData, setLiveResultsData] = useState(null);
    const [liveResultsError, setLiveResultsError] = useState(null);
    const [livePartyPercentages, setLivePartyPercentages] = useState({});
    const [lastUpdateTime, setLastUpdateTime] = useState(null);
    const [nextUpdateTime, setNextUpdateTime] = useState(null);

    const prevDirectMandatesRef = useRef({});
    const prevSeatsRef = useRef({});
    const liveResultsIntervalRef = useRef(null);
    const timerIntervalRef = useRef(null);

    // Debounced Funktion für Prozentänderungen
    const debouncedHandlePercentageChange = useCallback(
        debounce((partyId, value, currentPercentages) => {
            const newValue = value === '' ? '0' : value;
            const newPercentages = { ...currentPercentages, [partyId]: newValue };

            setPartyPercentages(newPercentages);
            // Berechne die neue Gesamtsumme
            const sum = Object.values(newPercentages).reduce((acc, val) => acc + parseFloat(val || 0), 0);
            setTotalPercentage(sum);
        }, 100),
        []
    );

    // Cleanup für debounced Funktion
    useEffect(() => {
        return () => {
            debouncedHandlePercentageChange.cancel();
        };
    }, [debouncedHandlePercentageChange]);

    // Konvertiere Live-Ergebnisse zu Gesamtprozenten für die Sidebar
    const convertLiveResultsToPartyPercentages = useCallback((liveData, partyMapping) => {
        if (!liveData || !partyMapping) {
            return {};
        }

        console.log('🔥 Converting live results to party percentages for sidebar');
        console.log('Live data length:', liveData.length);
        console.log('Party mapping:', partyMapping);

        const partyTotals = {};
        let totalValidVotes = 0;

        // Summiere Stimmen pro Partei über alle Wahlkreise
        liveData.forEach((row, index) => {
            const gueltigeStimmen = parseInt(row['D'] || '0');
            totalValidVotes += gueltigeStimmen;

            console.log(`Wahlkreis ${row['gebiet-nr']}: ${gueltigeStimmen} gültige Stimmen`);

            // Für jede Partei im Mapping
            Object.entries(partyMapping).forEach(([csvColumn, partyId]) => {
                const stimmen = parseInt(row[csvColumn] || '0');
                
                if (!partyTotals[partyId]) {
                    partyTotals[partyId] = 0;
                }
                partyTotals[partyId] += stimmen;
                
                console.log(`  ${partyId} (${csvColumn}): +${stimmen} Stimmen`);
            });
        });

        console.log('Party totals:', partyTotals);
        console.log('Total valid votes:', totalValidVotes);

        // Berechne Prozente
        const percentages = {};
        Object.entries(partyTotals).forEach(([partyId, votes]) => {
            const percentage = totalValidVotes > 0 ? (votes / totalValidVotes) * 100 : 0;
            percentages[partyId] = percentage.toFixed(2);
            console.log(`${partyId}: ${votes} Stimmen = ${percentage.toFixed(2)}%`);
        });

        console.log('Final party percentages:', percentages);
        return percentages;
    }, []);

    // CSV-Abruf Funktion
    const fetchLiveResults = useCallback(async (url) => {
        try {
            console.log('Starting fetch for URL:', url);
            setIsLoadingLiveResults(true);
            setLiveResultsError(null);
            
            let response;
            
            // Verwende direkt den PHP-Proxy (funktioniert sowohl in Development als auch Production)
            const proxyUrl = `/proxy.php?url=${encodeURIComponent(url)}`;
            console.log('Using PHP proxy URL:', proxyUrl);
            response = await fetch(proxyUrl);
            console.log('PHP proxy response status:', response.status);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const csvText = await response.text();
            console.log('CSV text length:', csvText.length);
            const lines = csvText.split('\n');
            const headers = lines[0].split(';');
            console.log('CSV headers:', headers);
            
            // Parse CSV Daten
            const results = [];
            for (let i = 1; i < lines.length; i++) {
                if (lines[i].trim()) {
                    const values = lines[i].split(';');
                    const row = {};
                    headers.forEach((header, index) => {
                        row[header.trim()] = values[index]?.trim() || '';
                    });
                    results.push(row);
                }
            }
            
            return results;
        } catch (error) {
            console.error('Fehler beim Abrufen der Live-Ergebnisse:', error);
            setLiveResultsError(error.message);
            return null;
        } finally {
            setIsLoadingLiveResults(false);
        }
    }, []);

    // Prüfe ob Live-Ergebnisse verfügbar sind und ob Schnellmeldungen vorhanden sind
    const checkLiveResultsAvailability = useCallback(async (corporationData) => {
        console.log('Checking live results availability for:', corporationData);
        console.log('Live results config:', corporationData?.['live-results']);
        
        if (!corporationData?.['live-results']?.enabled || !corporationData?.['live-results']?.url) {
            console.log('Live results not available - missing config or URL');
            setIsLiveResultsAvailable(false);
            setIsLiveResultsActive(false);
            return;
        }

        console.log('Fetching live results from:', corporationData['live-results'].url);
        const data = await fetchLiveResults(corporationData['live-results'].url);
        if (!data) {
            setIsLiveResultsAvailable(false);
            setIsLiveResultsActive(false);
            return;
        }

        // Prüfe ob in mindestens einem Gebiet Schnellmeldungen > 0 sind
        const hasSchnellmeldungen = data.some(row => {
            const anzahlSchnellmeldungen = parseInt(row['anz-schnellmeldungen'] || '0');
            return anzahlSchnellmeldungen > 0;
        });

        setIsLiveResultsAvailable(true);
        // isLiveResultsActive wird nur durch den Switch gesteuert, nicht durch Schnellmeldungen
        
        if (hasSchnellmeldungen) {
            setLiveResultsData(data);
            setLiveResultsEnabled(true); // Automatisch aktivieren wenn Schnellmeldungen vorhanden
            setIsLiveResultsActive(true); // Spalte anzeigen wenn Schnellmeldungen vorhanden
            setLastUpdateTime(new Date());
            setNextUpdateTime(new Date(Date.now() + 60000));
        }
    }, [fetchLiveResults]);

    // Live-Ergebnisse Handler
    const handleLiveResultsChange = useCallback((enabled) => {
        setLiveResultsEnabled(enabled);
        
        if (enabled && corporationData?.['live-results']?.url) {
            // Setze isLiveResultsActive sofort auf true wenn Switch aktiviert wird
            setIsLiveResultsActive(true);
            
            // Starte sofort einen Abruf
            fetchLiveResults(corporationData['live-results'].url).then(data => {
                if (data) {
                    setLiveResultsData(data);
                    setLastUpdateTime(new Date());
                    setNextUpdateTime(new Date(Date.now() + 60000));
                }
            });
        } else {
            // Setze isLiveResultsActive auf false wenn Switch deaktiviert wird
            setIsLiveResultsActive(false);
        }
    }, [corporationData, fetchLiveResults]);

    // Handler für Prozentänderungen
    const handlePercentageChange = useCallback((partyId, value) => {
        debouncedHandlePercentageChange(partyId, value, partyPercentages);
    }, [debouncedHandlePercentageChange, partyPercentages]);

    // Initialisiere die Prozentwerte, wenn corporationData sich ändert
    useEffect(() => {
        if (corporationData && corporationData.parties) {
            let initialPercentages = {};

            // Prüfe, ob poll-results vorhanden sind
            if (corporationData['poll-results']) {
                // Verwende die Umfrageergebnisse als initiale Werte
                const pollResults = corporationData['poll-results'];

                // Initialisiere alle Parteien mit 0
                corporationData.parties.forEach(party => {
                    initialPercentages[party.identifier] = 0;
                });

                // Setze die Werte aus den Umfrageergebnissen
                Object.keys(pollResults).forEach(partyId => {
                    if (Object.prototype.hasOwnProperty.call(initialPercentages, partyId)) {
                        initialPercentages[partyId] = pollResults[partyId].toString();
                    }
                });
            } else {
                // Fallback: Gleichmäßige Verteilung
                const initialPercentage = (100 / corporationData.parties.length).toFixed(1);
                corporationData.parties.forEach(party => {
                    initialPercentages[party.identifier] = initialPercentage;
                });
            }

            setPartyPercentages(initialPercentages);

            // Berechne die Gesamtsumme
            const sum = Object.values(initialPercentages).reduce(
                (acc, val) => acc + parseFloat(val || 0), 0
            );
            setTotalPercentage(sum);
        } else {
            setPartyPercentages({});
            setTotalPercentage(0);
            setSeatDistribution({});
            setDirectMandates({});
            setHoveredParty('');
        }
    }, [corporationData]);

    // Prüfe Live-Ergebnisse Verfügbarkeit wenn corporationData sich ändert
    useEffect(() => {
        if (corporationData) {
            checkLiveResultsAvailability(corporationData);
        } else {
            setIsLiveResultsAvailable(false);
            setIsLiveResultsActive(false);
            setLiveResultsEnabled(false);
            setLiveResultsData(null);
        }
    }, [corporationData, checkLiveResultsAvailability]);

    // Live-Ergebnisse Intervall
    useEffect(() => {
        if (liveResultsEnabled && corporationData?.['live-results']?.url) {
            // Starte Intervall für alle 60 Sekunden
            liveResultsIntervalRef.current = setInterval(() => {
                fetchLiveResults(corporationData['live-results'].url).then(data => {
                    if (data) {
                        setLiveResultsData(data);
                        setLastUpdateTime(new Date());
                        setNextUpdateTime(new Date(Date.now() + 60000));
                        // isLiveResultsActive bleibt true, solange der Switch aktiviert ist
                        // Die Spalte wird immer angezeigt, wenn Live-Ergebnisse aktiviert sind
                    }
                });
            }, 60000); // 60 Sekunden

            return () => {
                if (liveResultsIntervalRef.current) {
                    clearInterval(liveResultsIntervalRef.current);
                }
            };
        } else {
            // Stoppe Intervall wenn Live-Ergebnisse deaktiviert
            if (liveResultsIntervalRef.current) {
                clearInterval(liveResultsIntervalRef.current);
                liveResultsIntervalRef.current = null;
            }
        }
    }, [liveResultsEnabled, corporationData, fetchLiveResults]);

    // Timer-Effekt für Countdown-Anzeige
    useEffect(() => {
        if (isLiveResultsActive && nextUpdateTime) {
            timerIntervalRef.current = setInterval(() => {
                const now = new Date();
                const timeLeft = Math.max(0, nextUpdateTime.getTime() - now.getTime());
                
                if (timeLeft === 0) {
                    // Timer abgelaufen, nächste Aktualisierung in 60 Sekunden
                    setNextUpdateTime(new Date(now.getTime() + 60000));
                }
            }, 1000); // Jede Sekunde aktualisieren
        } else {
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
                timerIntervalRef.current = null;
            }
        }

        return () => {
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
                timerIntervalRef.current = null;
            }
        };
    }, [isLiveResultsActive, nextUpdateTime]);

    // Konvertiere Live-Ergebnisse zu Parteien-Prozenten
    useEffect(() => {
        if (isLiveResultsActive && liveResultsData && corporationData?.['live-results']?.['party-mapping']) {
            console.log('🔥 Converting live results to party percentages in sidebar');
            const percentages = convertLiveResultsToPartyPercentages(
                liveResultsData, 
                corporationData['live-results']['party-mapping']
            );
            setLivePartyPercentages(percentages);
        } else {
            setLivePartyPercentages({});
        }
    }, [isLiveResultsActive, liveResultsData, corporationData, convertLiveResultsToPartyPercentages]);

    // Leite Live-Ergebnisse-Daten an die App weiter
    useEffect(() => {
        if (onLiveResultsDataChange) {
            onLiveResultsDataChange(liveResultsData);
        }
    }, [liveResultsData, onLiveResultsDataChange]);

    useEffect(() => {
        if (onLiveResultsActiveChange) {
            onLiveResultsActiveChange(isLiveResultsActive);
        }
    }, [isLiveResultsActive, onLiveResultsActiveChange]);

    // Memoized Berechnung der Wahlkreissieger
    const memoizedDirectMandates = useMemo(() => {
        if (Object.keys(districtWinners).length === 0) {
            return {};
        }

        const counts = {};

        // Zähle die Anzahl der gewonnenen Wahlkreise pro Partei
        Object.values(districtWinners).forEach(partyId => {
            if (partyId) { // Nur gültige Partei-IDs zählen
                counts[partyId] = (counts[partyId] || 0) + 1;
            }
        });

        return counts;
    }, [districtWinners]);

    // Aktualisiere directMandates, wenn sich memoizedDirectMandates ändert
    useEffect(() => {
        if (JSON.stringify(memoizedDirectMandates) !== JSON.stringify(directMandates)) {
            setDirectMandates(memoizedDirectMandates);
        }
    }, [memoizedDirectMandates, directMandates]);

    const successfulIndependents = useMemo(() => {
        if (!independentCandidates) return 0;
        return Object.values(independentCandidates).filter(Boolean).length;
    }, [independentCandidates]);

    // Memoized Berechnung der Sitzverteilung
    const memoizedSeatDistribution = useMemo(() => {
        if (!corporationData || !seatAllocation) {
            return {};
        }

        // Verwende Live-Ergebnisse wenn aktiv, sonst manuelle Eingaben
        const percentagesToUse = isLiveResultsActive && Object.keys(livePartyPercentages).length > 0 
            ? livePartyPercentages 
            : partyPercentages;

        // Prüfe ob Prozente gültig sind (nur bei manuellen Eingaben)
        const totalPercentageToCheck = isLiveResultsActive 
            ? Object.values(percentagesToUse).reduce((sum, val) => sum + parseFloat(val || 0), 0)
            : totalPercentage;

        if (totalPercentageToCheck > 100) {
            return {};
        }

        const totalSeats = corporationData['council-seats'];
        const method = seatAllocation.key;

        // Berechne die Anzahl der erfolgreichen Einzelbewerber
        const independentSeats = Object.values(independentCandidates || {}).filter(Boolean).length;

        console.log('🔥 Calculating seat distribution with:', {
            isLiveResultsActive,
            percentagesToUse,
            totalPercentageToCheck,
            directMandates
        });

        // Für beide Methoden (rock und sainte-lague) die Direktmandate berücksichtigen
        if (Object.keys(directMandates).length > 0) {
            return calculateSeats(method, percentagesToUse, totalSeats, directMandates, independentSeats);
        } else {
            return calculateSeats(method, percentagesToUse, totalSeats, {}, independentSeats);
        }
    }, [corporationData, seatAllocation, totalPercentage, directMandates, partyPercentages, independentCandidates, isLiveResultsActive, livePartyPercentages]);


    // Aktualisiere seatDistribution, wenn sich memoizedSeatDistribution ändert
    useEffect(() => {
        if (JSON.stringify(memoizedSeatDistribution) !== JSON.stringify(seatDistribution)) {
            setSeatDistribution(memoizedSeatDistribution);
        }
    }, [memoizedSeatDistribution, seatDistribution]);

    // Berechne die Gesamtzahl der verteilten Sitze
    const totalAllocatedSeats = useMemo(() => {
        return Object.values(seatDistribution).reduce((sum, seats) => sum + seats, 0);
    }, [seatDistribution]);

    // Berechne die Gesamtprozente basierend auf Live-Ergebnissen oder manuellen Eingaben
    const effectiveTotalPercentage = useMemo(() => {
        if (isLiveResultsActive && Object.keys(livePartyPercentages).length > 0) {
            return Object.values(livePartyPercentages).reduce((sum, val) => sum + parseFloat(val || 0).toPrecision(7), 0);
        }
        return totalPercentage;
    }, [isLiveResultsActive, livePartyPercentages, totalPercentage]);

    // Berechne die Anzahl der Wahlkreise (Direktmandate) - die Hälfte der regulären Ratssitze
    const numDirectSeats = corporationData ? Math.floor(corporationData['council-seats'] / 2) : 0;

    // Berechne die Gesamtzahl der gewonnenen Wahlkreise
    const totalDirectMandates = useMemo(() => {
        return Object.values(directMandates).reduce((sum, count) => sum + count, 0);
    }, [directMandates]);

    // Öffne das Popover für die Kandidatenliste
    const handleOpenPopover = useCallback((event, partyId) => {
        setAnchorEl(event.currentTarget);
        setSelectedPartyForPopover(partyId);
    }, []);

    // Schließe das Popover
    const handleClosePopover = useCallback(() => {
        setAnchorEl(null);
        setSelectedPartyForPopover('');
    }, []);

    // Prüfe, ob das Popover geöffnet ist
    const open = Boolean(anchorEl);

    return (
        <Box sx={{ p: 2 }}>
            <Typography variant="h5" gutterBottom fontWeight="bold">
                Kommunalwahl Rechner
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="p" gutterBottom >
                    Mit Ratsrechner.de können Sie die Sitzverteilung in Ihrem Stadtrat oder Kreistag berechnen.
                </Typography>
            </Box>

            <ElectionSelect
                selectedElection={selectedElection}
                setSelectedElection={setSelectedElection}
                elections={elections}
            />

            <CorporationSelect
                selectedCorporation={selectedCorporation}
                onCorporationChange={onCorporationChange}
                corporations={corporations}
            />

            <LiveResultsSwitch
                liveResultsEnabled={liveResultsEnabled}
                onLiveResultsChange={handleLiveResultsChange}
                isLiveResultsAvailable={isLiveResultsAvailable}
                isLiveResultsActive={isLiveResultsActive}
                isLoading={isLoadingLiveResults}
                nextUpdateTime={nextUpdateTime}
                lastUpdateTime={lastUpdateTime}
            />

            {liveResultsError && (
                <Alert severity="error" sx={{ mt: 1, mb: 2 }}>
                    Fehler beim Abrufen der Live-Ergebnisse: {liveResultsError}
                </Alert>
            )}

            <CorporationInfo
                corporationData={corporationData}
                totalAllocatedSeats={totalAllocatedSeats}
                effectiveTotalPercentage={effectiveTotalPercentage}
                seatDistribution={seatDistribution}
                seatAllocation={seatAllocation}
                numDirectSeats={numDirectSeats}
                totalDirectMandates={totalDirectMandates}
                successfulIndependents={successfulIndependents}
            />

            {/* Anzeige der erfolgreichen Einzelbewerber */}
            {successfulIndependents > 0 && (
                <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" fontWeight="normal">
                        Erfolgreiche Einzelbew.: {successfulIndependents}
                    </Typography>
                </Box>
            )}

            {/* Parteien mit Prozentfeldern und Sitzverteilung */}
            {corporationData && corporationData.parties && (
                <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="subtitle1" fontWeight="medium">
                                Parteien:
                            </Typography>
                            {/* <Chip
                                label={`${totalPercentage.toFixed(1)}%`}
                                size="small"
                                color={totalPercentage > 100 ? "error" : "default"}
                                sx={{ ml: 1 }}
                            /> */}
                        </Box>
                        {effectiveTotalPercentage > 100 && (
                            <Alert severity="error" sx={{ py: 0, px: 1 }}>
                                Max. 100%! (Aktuell: {effectiveTotalPercentage.toFixed(1)}%)
                            </Alert>
                        )}
                    </Box>

                    <List disablePadding>
                        {corporationData.parties.map((party) => (
                            <PartyListItem
                                key={party.identifier}
                                party={party}
                                partyPercentage={partyPercentages[party.identifier]}
                                handlePercentageChange={handlePercentageChange}
                                seatAllocation={seatAllocation}
                                directMandates={directMandates}
                                seatDistribution={seatDistribution}
                                handleOpenPopover={handleOpenPopover}
                                effectiveTotalPercentage={effectiveTotalPercentage}
                                isLiveResultsActive={isLiveResultsActive}
                                livePartyPercentages={livePartyPercentages}
                            />
                        ))}
                        <ListItem
                            disablePadding
                            sx={{ mb: 1.5 }}
                        >
                            <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Box
                                        sx={{
                                            width: 16,
                                            height: 16,
                                            borderRadius: '50%',
                                            bgcolor: 'grey.500',
                                            mr: 1
                                        }}
                                    />
                                    <Typography variant="body2">
                                        Sonstige
                                    </Typography>
                                </Box>

                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <TextField
                                        type="number"
                                        size="small"
                                        disabled
                                        inputProps={{
                                            min: 0,
                                            max: 100,
                                            step: 0.1,
                                            style: { textAlign: 'right', padding: '4px 8px' }
                                        }}
                                        sx={{
                                            width: 95,
                                            '& input::-webkit-inner-spin-button, & input::-webkit-outer-spin-button': {
                                                WebkitAppearance: 'none',
                                                margin: 0,
                                            },
                                            '& input[type=number]': {
                                                MozAppearance: 'textfield',
                                            }
                                        }}
                                        value={
                                            isLiveResultsActive 
                                                ? (100 - Object.values(livePartyPercentages).reduce((sum, val) => sum + parseFloat(val || 0), 0)).toFixed(2)
                                                : (100 - totalPercentage).toFixed(1)
                                        }
                                        InputProps={{
                                            endAdornment: <InputAdornment position="end">%</InputAdornment>,
                                        }}
                                    />
                                </Box>
                            </Box>
                        </ListItem>

                    </List>


                    {/* Ausgelagerte Popover-Komponente */}
                    <CandidatesPopover
                        open={open}
                        anchorEl={anchorEl}
                        handleClosePopover={handleClosePopover}
                        selectedPartyForPopover={selectedPartyForPopover}
                        corporationData={corporationData}
                        seatDistribution={seatDistribution}
                        directMandates={directMandates}
                        districtWinners={districtWinners}
                    />

                    {/* Zusammenfassung der Sitzverteilung */}
                    <SeatSummary
                        effectiveTotalPercentage={effectiveTotalPercentage}
                        totalAllocatedSeats={totalAllocatedSeats}
                        corporationData={corporationData}
                        seatAllocation={seatAllocation}
                        successfulIndependents={successfulIndependents}
                    />
                </Box>
            )}
            {/* Footer mit Links zum Impressum und GitHub */}
            <Box
                sx={{
                    mt: 4,
                    pt: 2,
                    borderTop: '1px solid',
                    borderColor: 'divider',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                    fontSize: '0.875rem',
                    color: 'text.secondary'
                }}
            >
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <a
                        href="/impressum.html"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: 'inherit', textDecoration: 'none' }}
                    >
                        Impressum & Datenschutz
                    </a>
                    <a
                        href="https://github.com/Tools-for-Democracy/ratsrechner.de"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: 'inherit', textDecoration: 'none' }}
                    >
                        GitHub
                        <Tooltip
                            title="Über Github Issues können Sie uns Feedback geben oder Fehler melden. Sie können auch selbst Änderungen vornehmen und Pull Requests einreichen. Zum Beispiel um neue Städte hinzufügen."
                            placement="right"
                            arrow
                            enterTouchDelay={0}
                        >
                            <IconButton size="small" sx={{ ml: 0.5, p: 0.25 }}>
                                <InfoIcon fontSize="small" color="action" />
                            </IconButton>
                        </Tooltip>
                    </a>

                </Box>
                <Typography variant="caption" color="text.secondary">
                    © {new Date().getFullYear()} Tools for Democracy
                </Typography>
            </Box>
        </Box>
    );
}

export default Sidebar;

