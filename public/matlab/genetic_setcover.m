function [x_best, z_best, history] = genetic_setcover(A, costs, params)
%GENETIC_SETCOVER Algoritmo Genético para el problema SET COVER.
%
% Esquema general (Beasley & Chu, 1996; Aickelin, 2002):
%   1. Codificación binaria: x_j in {0,1} con j=1..N (1 si la antena j se selecciona).
%   2. Población inicial: 5% semillas greedy perturbadas + 95% aleatoria-cobertora.
%   3. Selección: torneo binario/ternario.
%   4. Cruce uniforme (swap por bit con prob 0.5).
%   5. Mutación bit-flip con probabilidad adaptativa (alta -> baja).
%   6. Operador de REPARACIÓN: garantiza factibilidad y elimina redundancias.
%   7. Elitismo: los k mejores pasan directamente a la siguiente generación.
%
% Función de fitness:
%   f(x) = sum_j c_j x_j + BIG_M * (clientes no cubiertos)
% Como la reparación garantiza factibilidad, el segundo término siempre vale 0
% para individuos válidos; se mantiene como red de seguridad.
%
% Entradas:
%   A      : matriz binaria MxN (clientes x antenas)
%   costs  : vector 1xN de costos
%   params : struct opcional con campos:
%       pop_size   (default 150)
%       generations(default 500)
%       p_cross    (default 0.9)
%       p_mut_ini  (default 0.03)
%       p_mut_fin  (default 0.005)
%       elitism    (default 3)
%       k_torneo   (default 3)
%       seed       (default 13)
%       verbose    (default true)
%       log_every  (default 25)
%
% Salidas:
%   x_best  : vector 1xN binario con la mejor solución hallada
%   z_best  : costo correspondiente
%   history : struct con campos best y avg (tamaño 1xgenerations)

    if nargin < 3, params = struct(); end
    p = default_params(params);

    rng(p.seed);

    [M, N] = size(A);
    A_log  = logical(A);
    cost   = costs(:)';
    cobertores = arrayfun(@(i) find(A_log(i,:)), 1:M, 'UniformOutput', false);

    % --- Población inicial -------------------------------------------------
    pop = false(p.pop_size, N);
    base_g = greedy_seed(A_log, cost);
    n_g = max(1, round(p.pop_size * 0.05));
    for k = 1:n_g
        ind = false(1, N);
        ind(base_g) = true;
        flips = randperm(N, randi([2, 8]));
        ind(flips) = ~ind(flips);
        pop(k, :) = repair(ind, A_log, cost);
    end
    for k = n_g+1:p.pop_size
        pop(k, :) = construct_random_cover(A_log, cost, cobertores);
    end

    fits = arrayfun(@(i) fitness(pop(i,:), A_log, cost, M), 1:p.pop_size);
    [bf, bi] = min(fits);
    x_best = pop(bi, :);
    z_best = bf;

    history.best = zeros(1, p.generations);
    history.avg  = zeros(1, p.generations);

    fprintf('\n=== ALGORITMO GENÉTICO ===\n');
    fprintf('  pop=%d  gens=%d  pcross=%.2f  pmut=[%.3f→%.3f]  elit=%d  seed=%d\n', ...
        p.pop_size, p.generations, p.p_cross, p.p_mut_ini, p.p_mut_fin, p.elitism, p.seed);

    % --- Loop evolutivo ----------------------------------------------------
    for g = 1:p.generations
        pmut = p.p_mut_ini + (p.p_mut_fin - p.p_mut_ini) * (g - 1) / max(1, p.generations - 1);
        new_pop = false(p.pop_size, N);

        % Elitismo
        [~, order] = sort(fits, 'ascend');
        for e = 1:p.elitism
            new_pop(e, :) = pop(order(e), :);
        end

        idx = p.elitism + 1;
        while idx <= p.pop_size
            p1 = tournament(pop, fits, p.k_torneo);
            p2 = tournament(pop, fits, p.k_torneo);
            if rand < p.p_cross
                [h1, h2] = uniform_crossover(p1, p2);
            else
                h1 = p1; h2 = p2;
            end
            h1 = bitflip_mutation(h1, pmut);
            h2 = bitflip_mutation(h2, pmut);
            h1 = repair(h1, A_log, cost);
            h2 = repair(h2, A_log, cost);
            new_pop(idx, :) = h1; idx = idx + 1;
            if idx <= p.pop_size
                new_pop(idx, :) = h2; idx = idx + 1;
            end
        end

        pop  = new_pop;
        fits = arrayfun(@(i) fitness(pop(i,:), A_log, cost, M), 1:p.pop_size);
        [bf, bi] = min(fits);
        if bf < z_best
            z_best = bf;
            x_best = pop(bi, :);
        end
        history.best(g) = z_best;
        history.avg(g)  = mean(fits);

        if p.verbose && (mod(g-1, p.log_every) == 0 || g == p.generations)
            fprintf('  gen %4d  best=%.0f  avg=%.0f  pmut=%.4f\n', ...
                g, z_best, mean(fits), pmut);
        end
    end

    fprintf('  GA terminó: z_best=%.0f  |S|=%d\n', z_best, sum(x_best));
end

% =========================================================================
%  Helpers
% =========================================================================
function p = default_params(user)
    p.pop_size    = 150;
    p.generations = 500;
    p.p_cross     = 0.9;
    p.p_mut_ini   = 0.03;
    p.p_mut_fin   = 0.005;
    p.elitism     = 3;
    p.k_torneo    = 3;
    p.seed        = 13;
    p.verbose     = true;
    p.log_every   = 25;
    fn = fieldnames(user);
    for k = 1:numel(fn)
        p.(fn{k}) = user.(fn{k});
    end
end

function sel = greedy_seed(A_log, cost)
    [M, N] = size(A_log);
    cubiertos = false(M, 1);
    sel = [];
    while ~all(cubiertos)
        ganancia = sum(A_log(~cubiertos, :), 1);
        cand = ganancia > 0;
        if ~any(cand), break; end
        ratios = inf(1, N);
        ratios(cand) = cost(cand) ./ ganancia(cand);
        [~, j] = min(ratios);
        sel(end+1) = j; %#ok<AGROW>
        cubiertos = cubiertos | A_log(:, j);
    end
end

function ind = construct_random_cover(A_log, cost, cobertores)
    [M, N] = size(A_log);
    ind = false(1, N);
    cubiertos = false(M, 1);
    orden = randperm(M);
    for k = 1:M
        i = orden(k);
        if ~cubiertos(i)
            j = cobertores{i}(randi(numel(cobertores{i})));
            ind(j) = true;
            cubiertos = cubiertos | A_log(:, j);
        end
    end
    ind = repair(ind, A_log, cost);
end

function ind = repair(ind, A_log, cost)
    % Si quedan clientes sin cubrir -> añadir antenas con menor ratio costo/ganancia.
    [M, N] = size(A_log);
    if ~any(ind)
        cubiertos = false(M, 1);
    else
        cubiertos = any(A_log(:, ind), 2);
    end
    while ~all(cubiertos)
        ganancia = sum(A_log(~cubiertos, :), 1);
        cand = ganancia > 0 & ~ind;
        if ~any(cand), cand = ganancia > 0; end
        ratios = inf(1, N);
        ratios(cand) = cost(cand) ./ ganancia(cand);
        [~, j] = min(ratios);
        ind(j) = true;
        cubiertos = cubiertos | A_log(:, j);
    end
    % Eliminación de redundancias en orden de costo decreciente
    sel = find(ind);
    [~, order] = sort(cost(sel), 'descend');
    for q = 1:numel(order)
        j = sel(order(q));
        otros = ind; otros(j) = false;
        if any(otros) && all(any(A_log(:, otros), 2))
            ind(j) = false;
        end
    end
end

function f = fitness(ind, A_log, cost, M)
    if any(ind)
        cub = sum(any(A_log(:, ind), 2));
    else
        cub = 0;
    end
    BIG_M = 1e8;
    f = sum(cost(ind)) + BIG_M * (M - cub);
end

function ind = tournament(pop, fits, k)
    n = size(pop, 1);
    idx = randi(n, 1, k);
    [~, w] = min(fits(idx));
    ind = pop(idx(w), :);
end

function [h1, h2] = uniform_crossover(p1, p2)
    mask = rand(1, numel(p1)) < 0.5;
    h1 = p1; h2 = p2;
    h1(mask) = p2(mask);
    h2(mask) = p1(mask);
end

function ind = bitflip_mutation(ind, pmut)
    flips = rand(1, numel(ind)) < pmut;
    ind(flips) = ~ind(flips);
end
