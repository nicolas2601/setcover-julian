%% RUN_ALL — Proyecto Final IO: SET COVER (exacto + GA)
% Carga la instancia 500x500, resuelve por programación lineal entera
% (intlinprog) y por algoritmo genético, y compara ambos métodos.
%
% Requiere:
%   - load_data.m
%   - exact_setcover.m
%   - genetic_setcover.m
%   - set_cover_500x500.csv
%   - Costo_S.xlsx
%
% Coloca todos los .m en una misma carpeta y los archivos de datos un
% directorio arriba (../set_cover_500x500.csv y ../Costo_S.xlsx) o ajusta
% las rutas abajo.

clear; clc; close all;

%% ---------- 1. Carga de datos ----------
csv_path  = fullfile('..', 'set_cover_500x500.csv');
xlsx_path = fullfile('..', 'Costo_S.xlsx');
[A, costs] = load_data(csv_path, xlsx_path);
[M, N] = size(A);

%% ---------- 2. Análisis exploratorio ----------
fprintf('\n=== EDA ===\n');
fprintf('  Densidad de A         : %.4f (%.2f%% de unos)\n', mean(A(:)), 100*mean(A(:)));
fprintf('  Antenas por cliente   : min=%d  med=%.1f  max=%d\n', ...
    min(sum(A,2)), median(double(sum(A,2))), max(sum(A,2)));
fprintf('  Clientes por antena   : min=%d  med=%.1f  max=%d\n', ...
    min(sum(A,1)), median(double(sum(A,1))), max(sum(A,1)));
fprintf('  Costo total si todas  : %.0f\n', sum(costs));

%% ---------- 3. Heurística greedy (referencia rápida) ----------
fprintf('\n=== HEURÍSTICA GREEDY (referencia) ===\n');
t0 = tic;
[g_sel, g_cost] = greedy_baseline(A, costs);
g_time = toc(t0);
fprintf('  |S_greedy|=%d  z_greedy=%.0f  tiempo=%.4fs\n', numel(g_sel), g_cost, g_time);

%% ---------- 4. Método exacto (ILP) ----------
TIME_LIMIT = 600; % 10 minutos
[x_exact, z_exact, info_exact] = exact_setcover(A, costs, TIME_LIMIT);

%% ---------- 5. Algoritmo Genético ----------
ga_params = struct( ...
    'pop_size',    150, ...
    'generations', 500, ...
    'p_cross',     0.9, ...
    'p_mut_ini',   0.03, ...
    'p_mut_fin',   0.005, ...
    'elitism',     3, ...
    'k_torneo',    3, ...
    'seed',        13, ...
    'verbose',     true, ...
    'log_every',   25);

t0 = tic;
[x_ga, z_ga, history] = genetic_setcover(A, costs, ga_params);
ga_time = toc(t0);

%% ---------- 6. Robustez del GA: 5 corridas con distintas semillas ----------
fprintf('\n=== ROBUSTEZ DEL GA (5 semillas) ===\n');
seeds = [7 13 21 42 99];
runs = zeros(1, numel(seeds));
for s = 1:numel(seeds)
    p = ga_params; p.seed = seeds(s); p.verbose = false;
    [~, z_s, ~] = genetic_setcover(A, costs, p);
    runs(s) = z_s;
    fprintf('  seed=%-4d  z=%.0f\n', seeds(s), z_s);
end
fprintf('  media=%.1f  std=%.1f  min=%.0f  max=%.0f\n', ...
    mean(runs), std(runs), min(runs), max(runs));

%% ---------- 7. Comparativa final ----------
gap_greedy = (g_cost - z_exact) / z_exact * 100;
gap_ga     = (z_ga    - z_exact) / z_exact * 100;
fprintf('\n=== COMPARATIVA FINAL ===\n');
fprintf('  ILP (CBC/intlinprog) : z=%.0f  |S|=%d  t=%.2fs  gap=0.000%%\n', ...
    z_exact, info_exact.num_selected, info_exact.elapsed_s);
fprintf('  Greedy heurístico    : z=%.0f  |S|=%d  t=%.4fs  gap=%.3f%%\n', ...
    g_cost, numel(g_sel), g_time, gap_greedy);
fprintf('  Algoritmo Genético   : z=%.0f  |S|=%d  t=%.2fs  gap=%.3f%%\n', ...
    z_ga, sum(x_ga), ga_time, gap_ga);

%% ---------- 8. Gráficas ----------
figure('Name','Convergencia GA','Position',[100 100 900 500]);
plot(history.best, 'b', 'LineWidth', 2); hold on;
plot(history.avg,  'Color', [1 0.5 0], 'LineWidth', 1);
yline(z_exact, '--g', sprintf('Óptimo = %.0f', z_exact), 'LineWidth', 1.5);
yline(g_cost,  ':r', sprintf('Greedy = %.0f', g_cost),  'LineWidth', 1.5);
xlabel('Generación'); ylabel('Costo (fitness)');
title('Convergencia del Algoritmo Genético — SET COVER 500×500');
legend('Mejor','Promedio población','Óptimo','Greedy','Location','best');
grid on; saveas(gcf, 'convergencia_ga.png');

figure('Name','Comparativa costos','Position',[100 100 800 400]);
metodos = {'Greedy','GA','Exacto'};
valores = [g_cost, z_ga, z_exact];
bar(valores, 'FaceColor','flat');
set(gca, 'XTickLabel', metodos);
ylabel('Costo total ($)'); title('Comparativa de costos');
for k=1:numel(valores)
    text(k, valores(k), sprintf('%.0f', valores(k)), ...
        'HorizontalAlignment','center','VerticalAlignment','bottom');
end
grid on; saveas(gcf, 'comparativa_costos.png');

figure('Name','Histograma costos','Position',[100 100 800 400]);
histogram(costs, 40, 'FaceColor', [0.18 0.49 0.20]);
xlabel('Costo de antena ($)'); ylabel('Frecuencia');
title('Distribución de costos de las 500 antenas'); grid on;
saveas(gcf, 'hist_costos.png');

%% ---------- 9. Persistir resultados ----------
sol_exact = find(x_exact == 1);
sol_ga    = find(x_ga    == 1);

fid = fopen('resultados.txt', 'w');
fprintf(fid, '=== Resultados Set Cover 500x500 ===\n\n');
fprintf(fid, 'Óptimo exacto:  z*=%.0f  |S|=%d  t=%.2fs\n', z_exact, numel(sol_exact), info_exact.elapsed_s);
fprintf(fid, 'Antenas seleccionadas (1-indexed):\n%s\n\n', num2str(sol_exact(:)'));
fprintf(fid, 'Algoritmo genético: z=%.0f  |S|=%d  t=%.2fs  gap=%.3f%%\n', ...
    z_ga, numel(sol_ga), ga_time, gap_ga);
fprintf(fid, 'Antenas seleccionadas (1-indexed):\n%s\n\n', num2str(sol_ga(:)'));
fprintf(fid, 'Greedy: z=%.0f  |S|=%d  t=%.4fs  gap=%.3f%%\n', ...
    g_cost, numel(g_sel), g_time, gap_greedy);
fclose(fid);

save('setcover_resultados.mat', 'A', 'costs', 'x_exact', 'z_exact', 'info_exact', ...
    'x_ga', 'z_ga', 'history', 'ga_params', 'runs', 'seeds', 'g_sel', 'g_cost');

fprintf('\nArchivos generados: resultados.txt, setcover_resultados.mat, *.png\n');
fprintf('FIN.\n');

%% ============================================================
function [sel, z] = greedy_baseline(A, costs)
    [M, N] = size(A);
    A_log = logical(A);
    cubiertos = false(M, 1);
    sel = [];
    while ~all(cubiertos)
        ganancia = sum(A_log(~cubiertos, :), 1);
        cand = ganancia > 0;
        if ~any(cand), break; end
        ratios = inf(1, N);
        ratios(cand) = costs(cand) ./ ganancia(cand);
        [~, j] = min(ratios);
        sel(end+1) = j; %#ok<AGROW>
        cubiertos = cubiertos | A_log(:, j);
    end
    z = sum(costs(sel));
end
