// ============================================================
// Real MATLAB snippets extracted from public/matlab/*.m files
// ============================================================

// ---- EXACT (intlinprog) — 35 lines --------------------------
export const EXACT_SNIPPET = `function [x_opt, z_opt, info] = exact_setcover(A, costs, time_limit)
%EXACT_SETCOVER Resuelve el SCP por programación lineal entera.
%
%   min   c' * x
%   s.a.  A * x >= 1     (cada cliente cubierto al menos una vez)
%         x in {0,1}^N

    if nargin < 3, time_limit = 600; end

    [M, N] = size(A);
    f = costs(:);                   % minimizar f' * x
    intcon = 1:N;                   % todas las variables son enteras

    % intlinprog usa restricciones de la forma A_ineq * x <= b
    % Nosotros queremos A*x >= 1  ->  -A*x <= -1
    A_ineq = -double(A);
    b_ineq = -ones(M, 1);

    lb = zeros(N, 1);
    ub = ones(N, 1);

    opts = optimoptions('intlinprog', ...
        'Display', 'iter', ...
        'MaxTime', time_limit, ...
        'IntegerTolerance', 1e-6, ...
        'RelativeGapTolerance', 1e-6);

    t0 = tic;
    [x, fval, exitflag, output] = intlinprog(f, intcon, A_ineq, b_ineq, ...
        [], [], lb, ub, opts);
    elapsed = toc(t0);

    if isempty(x)
        error('intlinprog no encontró solución (exitflag=%d).', exitflag);
    end`.trim();

// ---- GA Main Loop — 40 lines --------------------------------
export const GA_LOOP_SNIPPET = `    % --- Loop evolutivo ----------------------------------------
    for g = 1:p.generations
        pmut = p.p_mut_ini + (p.p_mut_fin - p.p_mut_ini) * ...
               (g - 1) / max(1, p.generations - 1);
        new_pop = false(p.pop_size, N);

        % Elitismo: los k mejores pasan directamente
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
    end`.trim();

// ---- GA Repair operator — 28 lines --------------------------
export const GA_REPAIR_SNIPPET = `function ind = repair(ind, A_log, cost)
    % Si quedan clientes sin cubrir -> añadir antenas
    % con menor ratio costo/ganancia.
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
end`.trim();

// ---- Focus line sets (1-based) --------------------------------

// Highlight the intlinprog call + constraint setup
export const EXACT_FOCUS_LINES: number[] = [14, 15, 16, 17, 18, 23, 24, 25, 26, 27, 30, 31];

// Highlight elitism + crossover + mutation + repair
export const GA_LOOP_FOCUS_LINES: number[] = [8, 9, 10, 15, 16, 17, 18, 20, 21, 22, 23, 24, 25];

// Highlight the greedy ratio selection + redundancy removal
export const GA_REPAIR_FOCUS_LINES: number[] = [11, 12, 13, 14, 15, 16, 21, 22, 23, 24, 25, 26];
